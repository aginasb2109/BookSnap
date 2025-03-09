import express from "express";
import bodyParser  from "body-parser";
import pg from "pg";
import axios from "axios";
import env from "dotenv";


const app=express();
const port=3000;

env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db=new pg.Client({
    user:process.env.PG_USER,
    host:process.env.PG_HOST,
    database:process.env.PG_DATABASE,
    password:process.env.PG_PASSWORD,
    port:process.env.PG_PORT,
})

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));




app.get("/",async(req,res)=>{
    const querydata=req.query.sort;
    
    try{
        let query="SELECT * FROM Books" ;
        if(querydata=="ratings"){
            query+=" ORDER BY rating DESC";
        }
        else if(querydata=="dateofPublish"){
            query+= " ORDER BY dateofpublish DESC";
        }
        else{
           query+=" ORDER BY id ASC";
        }
        const result=await db.query(query);
        const books=result.rows;
        res.render("index.ejs",{
            booksitem:books,
            message:null
        });
    }
    catch(err){
        console.log(err);
    }



   


})
app.get("/addNew",(req,res)=>{
res.render("AddNew.ejs");
})

app.post("/add", async(req,res)=>{
try{
    console.log(req.body);
const title=req.body.title;
const review=req.body.review;
const rating=req.body.rating;
const Genre=req.body.genre


const apiRes=await axios.get(`https://openlibrary.org/search.json?title=${title}`);
const book=apiRes.data.docs[0] ;
const fullTitle = book.title; 
const author = book.author_name ? book.author_name.join(", ") : "Unknown"; 
const publishDate = book.first_publish_year || "Unknown"; 
const coverid = book.cover_i; 
const coverimg = coverid ? `https://covers.openlibrary.org/b/id/${coverid}-L.jpg` : "/default-cover.jpg";





await db.query("INSERT INTO Books (title, author,rating,review,dateofPublish,cover_url,genre) VALUES($1,$2,$3,$4,$5,$6,$7)",[fullTitle,author,rating, review,publishDate,coverimg,Genre]);



res.redirect("/");


}catch(err){
    console.log(err);
}
});

app.post("/delete/:id", async(req,res)=>{
    try{
        const id=parseInt(req.params.id);
    await db.query("DELETE FROM Books WHERE id=$1",[id]);
    res.redirect("/");
    }catch(err){
        console.log(err);
    }
})

app.get("/review/:id", async(req,res)=>{
    const id=parseInt(req.params.id);
    const result=await db.query("SELECT * FROM Books WHERE id=$1",[id]);
    const bookscollected=result.rows[0];

    
    res.render("review.ejs",{
        book:bookscollected
    });
})



app.post("/edit/:id", async(req,res)=>{
    const id=parseInt(req.params.id);
    const title=req.body.title;
    const author=req.body.author;
    const dateofpublish=req.body.dateofpublish;
    const review=req.body.review;
    const rating=req.body.rating;

    await db.query("UPDATE Books SET title=$1, author=$2, dateofPublish=$3, review=$4, rating=$5 WHERE id=$6",
            [title, author, dateofpublish, review, rating, id])
    res.redirect("/");     

    
})


app.get("/update/:id",async(req,res)=>{
    const id=parseInt(req.params.id);
    const result = await db.query("SELECT * FROM Books WHERE id=$1", [id]);
    const books = result.rows[0]; 
        
        res.render("edit.ejs",{
            book:books, editMode:true
        });

})


app.get("/search",async(req,res)=>{
const data=req.query.query;
console.log(data);
try{
    if(!data  || data.trim()==""){
        return res.redirect("/");
    }
    
    else{
    
   
    const result = await db.query("SELECT * FROM Books WHERE LOWER(title) LIKE LOWER($1)", [`%${data}%`]);
    if (result.rows.length === 0) {
        res.render("index.ejs", {
            booksitem: [],
            message: "No books found for your search!"
        });
    } else {
        const books=result.rows;
        res.render("index.ejs", { booksitem: books, message: null });
    }
    
    
    }
}
catch(err){
    console.log(err);
}
});

app.get("/about",(req,res)=>{
    res.render("about.ejs");

});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  
