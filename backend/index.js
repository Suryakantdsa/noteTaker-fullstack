const express=require("express")
const app =express()
const cors=require("cors")
const mongoose=require("mongoose")
const Jwt=require("jsonwebtoken")
const jwtKey="noteTaker"
const uri=`mongodb+srv://Suryakant:Suryadas@cluster0.mydbwj6.mongodb.net/NoteTaker?retryWrites=true&w=majority`

const User=require("./models/users")
const Note=require("./models/notes")

mongoose.connect(uri)
.then(()=>{console.log("connected to db success")})

app.use(express.json())
app.use(cors())

app.get("/",(req,resp)=>{
    resp.send({msg:"working fine"})
})

app.post("/signup",async(req,resp)=>{
    try{
        let newUser=new User(req.body)
        let result=await newUser.save()
        result=result.toObject();
        delete result.password
        // resp.send(result)
        if(result){
            Jwt.sign({result},jwtKey,(err,token)=>{
                if(err){
                    resp.send({msg:"somthing went wrong"})
                }else{
                    resp.send({result,auth:token})
                }

            })
        }

    }catch{
        resp.status(404).send({msg:"Creating new account failed"})
    }
})

app.post("/signin",async(req,resp)=>{
    try{    
        console.log(req.body)

        if(req.body.email && req.body.password){
            let result =await User.findOne(req.body).select("-password")
            console.log(result)
            if(result){
                Jwt.sign({result},jwtKey,(err,token)=>{
                    if(err){
                        resp.send({msg:"somthing went wrong"})
                    }else{
                        resp.send({result,auth:token})
                    }
    
                })
            }
            else{
                resp.status(404).send({msg:"User doesn't exist , please register"})
            }
        }
        else{
            resp.send({msg:"All field are mandatory"})
        }
    }catch{
       
    }
})

app.post("/addnote",verifyToken, async (req, resp) => {
    try {
        let newNote = new Note(req.body)
        let result = await newNote.save();
        resp.send(result)
        
    }
    catch {
        resp.status(400).json({ message: "enter a vaild note" })
    }
})

app.get("/home",verifyToken, async (req, resp) => {
    try {
        let allNote = await Note.find();
        if (allNote.length > 0) {
            resp.send(allNote)
            console.log(allNote)
        }
        else {
            resp.send({ result: "no product found" })
        }
    }

    catch {
        resp.status(400).json({ message: "no products found" })
    }
})
app.delete("/note/:id", verifyToken, async (req, resp) => {
    try {
        let result = await Note.deleteOne({ _id: req.params.id })
        resp.send(result)
    }
    catch {
        resp.status(400).json({ message: "no product is found to be delete" })
    }
})
app.delete("/home", verifyToken, async (req, resp) => {
    try {
        let result = await Note.deleteMany({})
        resp.send(result)
        
    }
    catch {
        resp.status(400).json({ message: "no product is found to be delete" })
    }
})

app.get("/:id", verifyToken, async (req, resp) => {
    try {

        let result = await Note.findOne({ _id: req.params.id })
        if (result) {
            resp.send(result)
        }
        else {
            resp.send({ result: "no record found" })
        }
    }
    catch {
        resp.status(400).json({ message: "no product is found" })
    }
})
app.put("/note/:id",verifyToken, async (req, resp) => {
    try{

        let result = await Note.updateOne(
            { _id: req.params.id },
            {
                $set: req.body
            }
        )
        resp.send(result)
    }
    catch{
        resp.status(400).json({ message: "error in upadating" })
    }
})

// app.get("/:key",async(req,resp)=>{
//     let result=await Note.find(
//         {
//             "$or":[
//                 {title:{$regex:req.params.key}}

//             ]
//         }
//     )
//     resp.send(result)

// })
app.get('/search/:key',verifyToken, async (req, res) => {
    try {
      const searchKey = req.params.key;
      const matchingNotes = await Note.find({ title: { $regex: searchKey, $options: 'i' } });
      res.json(matchingNotes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

function verifyToken(req,resp,next){
    let token=req.headers["authorization"]
    if(token){
        token=token.split(" ")[1]
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({msg:"please provide a vaild token"})
            }
            else{
                next()
            }
        })
    }
    else{
        resp.status(403).send({msg:"please add tocken with header"})
    }
}


app.listen(5000,()=>{console.log("app is running on port5000")})