const express = require("express")
const app = express()
// const fs = require('fs')
require("./mongoose")
const port = process.env.PORT || 3000
// const path = require("path")
// const upload2 = require("express-fileupload");
const bodyParser = require('body-parser');
const auth = require('./middleware/auth')
var cookieParser = require('cookie-parser')
const bcrypt = require("bcryptjs")
const multer = require('multer')
// const Hashtag = require("./model/hash_images")
// const Image = require("./model/image")
const Profile = require("./model/user")
const Hash_search = require("./model/searches")



app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser()) 

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname+'/login.html'));

})


app.post('/users',async (req,res)=> {
    console.log(req.body)
    //return res.redirect('./start/index.html')
    
    if(req.body.password === req.body.re_pass){

        const password = await bcrypt.hash(req.body.password,8)
        const profile = new Profile({
            name: req.body.name,
            username: req.body.username,
            age: req.body.age,
            email: req.body.email,
            sex: req.body.sex,
            followers: Math.floor((Math.random() * 1000) +1),
            following: Math.floor((Math.random() * 1000) +1),
            password: password,
            views: 0
   
        })

        try{
            await profile.save()
            console.log("Successfully signed up");
            res.sendFile(path.join(__dirname+'/login/index.html'));
        }catch(e) {
            // res.status(400).send(e)
            console.log(e)
            res.sendFile(path.join(__dirname+'/login/index.html'));
        }
           
        
    }else {
        res.send("Your passwords don't match");
    }
     
 })


app.get('/users/me',auth, (req,res) =>{
// res.send("hello");
    res.sendFile(path.join(__dirname+'/start/profile.html'));
    //res.send(req.user)
})
 
app.get('/users/signin',auth,async (req, res) => {
    // console.log(token)
    //console.log(req.header('Authorization:'))
    console.log(req.cookies['Auth'])
    //res.write('authenticates');
    //res.setHeader('Authorization: ' )
    res.sendFile(path.join(__dirname+'/start/profile.html'));
    //res.end()
})


app.post('/users/signin', async (req,res) => {
    console.log("Signing in..")
    try {
        const profile = await Profile.findByCredentials(req.body.username, req.body.pass)
        console.log("Successfully signed in");
        //const token = await profile.generateAuthToken()
        const token = await profile.generateAuthToken()
        
        //res.send({ user: profile.getPublicProfile(), token})
        var options = {
            root: path.join(__dirname, '/'),
            dotfiles: 'deny',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
                'Authorization' : 'Bearer ' + token
            }
            }
        
            var fileName = '/start/profile.html'
            res.cookie('Auth','Bearer '+ token).sendFile(fileName, options, function (err) {
            if (err) {
                next(err)
            } else {
                console.log('Sent:', fileName)
            }
            })
           
    
    }catch {
        console.log("Sign in failed")
        res.status(401).send()
    }
    
})

app.get('/profile',auth,async (req,res ) => {
    try{
        const user = await Profile.findById(req.user._id)
        //await user.populate('image').execPopulate()
        const profile = req.user.getPublicProfile(user);
        var myvar = {createdAt : -1}
        const images = await Image.find({owner: user._id}).limit(2).sort(myvar);
        const hash = {number : -1}
        const hashtag = await Hash_search.find({}).sort(hash).limit(5)

        res.send({profile, images, hashtag});
    } catch(e) {
        console.log(e);
        res.status(404).send()
    }
    

    
})

app.post('/users/logout' , auth ,async (req,res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token !== req.token
        })
        await req.user.save()
        res.redirect('http://localhost:3000/')
        res.end()
    } catch (e) {
        res.status(500).send()
    }
})

app.post('/users/logoutAll' , auth ,async (req,res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.redirect('http://localhost:3000/')
        res.end()
    } catch (e) {
        res.status(500).send()
    }
})



// app.post('/search',(req,res) => {
//     var query = req.body.query 
    

//     if(query[0] === '#')
//     {
//         var hashtag = /#[a-zA-Z0-9]*/g;
//         query = query.match(hashtag);
//         query = query[0];
//         Hashtag.find({hashtag : query}).then((hash) => {
//             if(!hash){
//                 return res.status(404).send()
//             }
//             res.send(hash)
//         }).catch((e) => {
//             console.log(e)
//         })
//     }else {
//         // query = query.slice(1,)
//         console.log("profile")
//         Profile.find({username : query}).then((user) => {
//             if(!user){
//                 return res.status(404).send()
//             }
//             console.log(user[views]);
//             Profile.findOneAndUpdate({username : query},{views : user.views + 1},{runValidators: true,new: true})
//             //res.send(user._id,user.name,user.username)
//         }).catch((e) => {
//             console.log(e)
//         })
//     }
//     console.log(req.body)
// })
app.use(bodyParser.json())

app.get('/users/me/search',auth,async (req,res) => {
    //console.log(req)

    var query = req.query
    
    console.log(query)
    //console.log(req.query.id)
    //console.log("query " + req.body.query)
    item = query.quer
    console.log(item)
    var hsh = /[\*a-zA-Z0-9]*/;
    var resi = item.match(hsh); 
    console.log(resi)
    if(resi[0][0] === '*')
    {
        resi = '#'+resi[0].slice(1,)
        console.log(resi)
        try {
            const hash = await Hashtag.find({hashtag : resi})
            if(!hash){
                return res.status(404).send()
            }
            const hash_search = await  Hash_search.findOne({hashtag: resi});
            console.log(hash_search)
            if(!hash_search){
                var new_hashtag = new Hash_search({
                    hashtag: resi,
                    number: 1
                })
                await new_hashtag.save();
             } 
             else {
                hash_search.number = hash_search.number+1;
                await hash_search.save()
            }
            var sendRequest = {}
            var arr= []
            for(i=0; i<hash.length;i++){
                
                
                //sendRequest = {...sendRequest,...images}
                arr.push(hash[i].imageId)
                //var gyan = res.write(images);

                //console.log(gyan)


            }
            var images = await Image.find({
                _id:{
                    $in: arr
                }});
            //const images = await Image.findById(hash.imageId)
            //res.send(hash)
            //console.log(sendRequest)
            res.send({images})
            console.log(images)
            //console.log(hash)
            console.log(hash.length)
        }catch(e) {
            res.status(404).send(e)
            console.log(e)
        }
    }
        
        
    else {
        // query = query.slice(1,)
        console.log("profile")
        try {
            console.log(resi[0])
            const profile = await Profile.findOne({username : resi[0]})

            if(!profile){
                return res.send('<script><alert>No user found</alert></script>')
               // return res.status(404).send()
            }
            res.send({'name' : profile.name ,'username' : profile.username,"profile_image":profile.profile_image}) 
            console.log(profile)
        }catch (e){
            res.status(404).send(e)
        }
        
            
    }
    
})
 
// app.get('/profile' ,async (req ,res) => {
//     _id = await Profile.decoder(token);


// })

app.get('/users/me/query',async (req,res) => {
    var query = req.query
    
    console.log(query)
    //console.log(req.query.id)
    //console.log("query " + req.body.query)
    item = query.quer
    console.log(item)
    var hsh = /[\*a-zA-Z0-9]*/;
    var resi = item.match(hsh); 
    console.log(resi)
    if(resi[0][0] === '*')
    {
        resi = '#'+resi[0].slice(1,)
        console.log(resi)
        try {
            const hash = await Hashtag.find({hashtag : {
                '$regex': '^'+resi
            }})
            
            
            
            //const images = await Image.findById(hash.imageId)
            //res.send(hash)
            //console.log(sendRequest)
            console.log({hash})
            res.send({hash})
            //console.log(images)
            //console.log(hash)
            console.log(hash.length)
        }catch(e) {
            res.status(400).send(e)
            console.log(e)
        }
    }
        
        
    else {
        // query = query.slice(1,)
        console.log("profile")
        try {
            console.log(resi[0])
            const profile = await Profile.find({username: /^t/})

            if(!profile){
                return res.send('<script><alert>No user found</alert></script>')
               // return res.status(404).send()
            }
            res.send({'name' : profile.name ,'username' : profile.username,"profile_image":profile.profile_image}) 
            console.log(profile)
        }catch (e){
            res.status(400).send(e)
        }
        
            
    }
    
    
})

app.get('/users/me/update', auth,async (req,res) => {
   
    const updates = Object.keys(req.body)
    const allowedUpdates  = ['name','age','password','about'];
    const isValidOperation = updates.every((updates) => allowedUpdates(updates))

    if(!isValidOperation) {
        return res.status(400).send( { error: 'Invalid Updates!' })

    }

    try {
        //const profile = await Profile.findOneAndUpdate({username : req.body.username},{name: req.body.name ,age: req.body.age},{runValidators: true,new: true})
        //const profile = await Profile.findOne({username: req.body.username})
        //const 
        updates.forEach((update) => req.user[update] = req.body[update])
        //await profile.save()
        await req.user.save()
        
        res.send(profile)
    }catch(e) {
        res.status(400).send(e)
    }
})

app.get('/users/del_image/:id',auth,  async (req, res) => {
    try{
        const image = await Image.findOneAndDelete({ _id: req.params.id, owner: req.user._id})
        
        if(!image) {
            res.status(404).send()
        }

        res.send(image)
    } catch (e) {
        res.status(500).send()
    }
})

app.use("/uploads",express.static(__dirname+ "/uploads"))

var Storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, file.fieldname+ "-"+Date.now() + path.extname(file.originalname))
    }

});

var uploaddp = multer({
    storage:Storage
})
var upload = multer({
     dest: 'uploads/' 
})

app.post('/users/me/image_upload' ,auth, uploaddp.single('image'), async (req,res) =>{
    console.log("updating profile")
    console.log(req.body.comment)
    console.log(req.file)

    try{
        //const update = Object.keys(req.body);
         var success = req.file.filename + " uploaded successfully";
        // res.render('upload-file', { title: 'Upload File' ,success: success})
       // var success = req.body.filename + " uploaded successfully"
        //res.render('upload-file', { title: 'Upload File' ,success: success})
        
        var image = new Image({
            imageName: req.file.filename,
            owner: req.user._id
        })

        var imageId = await image.save();
        var uploads = req.user[uploads];
        req.user[uploads] = uploads+1;
        await req.user.save()

        var reg = req.body.comment.toString();
        var hashtag = /#[a-zA-Z0-9]*/g;
        //console.log(reg)
        var result = reg.match(hashtag);
        //console.log("result " +result + result.length)
        var i=0;
        if(result.length >0){
            for(i=0;i<result.length;i++){
                //console.log(result[i])
                var hashes = new Hashtag({
                    hashtag: result[i],
                    imageId: imageId._id
                })
                await hashes.save();
            }
        }
        
        console.log(imageId)
        res.status(200).sendFile(path.join(__dirname+'/start/image_upload.html'));
    } catch(e) {
        console.log(e)
        res.status().send()
    }
    
})

// Image Uploading
app.use(upload2())
app.post('/users/me/avatar', auth, async (req, res) => {
    
    try {
            console.log(req.files.name)
            var file = req.files.filename,

            filename = file.name.split('.');
            var newfilename = filename[0] +Date.now().toString()+'.'+filename[1]
            //console.log(file);
            console.log(newfilename);
            file.mv('./uploads/' + newfilename, function(err){
                if(err){
                    console.log("404 error");
                    res.send("error occured");
                    throw Error;
    
                }})
                req.user['profile_image'] = newfilename;
                //await profile.save()
                await req.user.save()
            
            res.status(201).redirect('/users/signin')
                
    } catch (e) {
        console.log(e)
        res.send("Something wrong happens")
    }  
    
})

// app.post('/users/me/image_upload', auth, async (req, res) => {
//     console.log(req.body)   
//     console.log(req.body.filename) 
//     console.log(req.body.comment) 
//     console.log(req.files.filename)
//     // try {
//     //         req.files = req.body.filename;
//     //         var file = req.files.filename,
            
//     //         filename = file.split('.');
//     //         var newfilename = filename[0] +Date.now().toString()+'.'+filename[1]
//     //         //console.log(file);
//     //         console.log(newfilename);
//     //         file.mv('./uploads/' + newfilename, function(err){
//     //             if(err){
//     //                 console.log("404 error");
//     //                 res.send("error occured");
//     //                 throw Error;
    
//     //             }})
//     //         const images = new Image({
//     //             imageName: newfilename,
//     //             owner: req.user._id
//     //         })
//     //         console.log(images);
//     //         const image = await images.save();
//     //         console.log(image);
//     //         res.status(201).send("Successfully uploaded")
                
//     // } catch (e) {
//     //     console.log(e)
//     //     res.send("Something wrong happens")
//     // }  
    
// })

// app.get("/users/me/file_uploads", auth,function(req,res){
//     res.sendFile(path.join(__dirname+'/start/file_upload.html'));
// })

// app.post("/users/me/file_uploads",auth, function(req, res){
//     if(req.files){
//         var file = req.files.filename,
//         filename = file.name;
//         console.log(file);
//         console.log(filename);
//         file.mv('./uploads/' + filename, function(err){
//             if(err){
//                 console.log("404 error");
//                 res.send("error occured");

//             }else{
//                 res.send("done!.");
//             }
//         })
//     }
// })

app.get('/users/me/image_download', auth, async (req, res) => {
    const name = req.query.filename;
    try {
        var fileLocation = path.join('./uploads',name);
        console.log(fileLocation);
        res.download(fileLocation, name);
    } catch (e) {
        res.status(500).send()
    }
})

app.get('/users/me/delete',auth, async (req,res) => {
    try {
        // const user = await Profile.findByIdAndDelete( req.user._id)

        // if(!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()
        console.log(req.user)
        res.sendFile(path.join(__dirname+'/login/index.html'));
    }catch(e) {
        res.status().send({error : "User can't be deleted"})
    }
})


// const profile = Profile.find().toArray(function(err, result) {
//     if (err) throw err;
//     console.log(result);

// })
// // console.log(profile)
 
// filtering
// GET /pictures?profile=true
// GET /pictures?limit=10&skip=10
// GET /pictures?sortBy=createdAt:asc
// GET /pictures?sortBy=createdAt:desc
app.get('/pictures', auth, async (req ,res) => {
    const match = {}
    const sort = {}
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }


    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'images',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                // sort: {
                //     createdAt: -1
                // }
                sort
            }
        }).execPopulate()
    } catch (e) {
        res.status(500).send()
    }
})

// const upload = multer({
//     dest: 'uploads/'
// })

// // app.post('/upload', upload.single('upload'), (req,res) => {
// //     res.send()
// // })


// app.post('/upload', upload.single('image'),(req ,res) =>{
//    // console.log(req.body)
//     //console.log(req.files)
//     var tmp_path = req.file.path+req.file.originalname.extname;
//     console.log(tmp_path)
//     console.log(req.file.originalname)
//   /** The original name of the uploaded file
//       stored in the variable "originalname". **/
//   var target_path = 'uploads/' + req.file.originalname;

//   /** A better way to copy the uploaded file. **/
//   var src = fs.createReadStream(tmp_path);
//   var dest = fs.createWriteStream(target_path);
//   src.pipe(dest);
//   src.on('end', function() { res.render('complete'); });
//   src.on('error', function(err) { res.render('error'); });
// })

// const uploada = multer({
//     dest: 'avatars',
//     limits: {
//         fileSize: 5000000
//     },
//     fileFilter(req , file ,cb) {
//         if(!file.originalname.match(/\.(jpg|png|jpeg)$/)){
//             return cb(new Error('Please upload a image'))
//         }
//         cb(undefined, true)
//         // cb(new Error('File must be a image'))
//         // cb(undefined, true)
//         // cb(undefined, false)

//     }
// })

// app.post('/users/me/avatar', uploada.single('avatar'), (req, res) => {
//     res.send()
// })

app.use('/start',express.static(__dirname + '/start'));
app.use('/',express.static(__dirname + '/start/style1.css'));
app.use('/login',express.static(__dirname + '/login'));
app.use('/images',express.static(__dirname + '/images'));
app.use('/static',express.static(__dirname+ '/static'));
app.use('/node_modules',express.static(__dirname+ '/node_modules'))
app.use('/rough',express.static(__dirname + '/rough'))
app.use('/login',express.static(__dirname + '/login/css/style.css'));
app.use('/login',express.static(__dirname + '/login/fonts/material-icon/css/material-design-iconic-font.min.css'));
app.use('/login',express.static(__dirname + '/login/images'));
app.use('/login',express.static(__dirname + '/login/js/main.js'));
app.use('/login',express.static(__dirname + '/login/scss'));
app.use('/uploads',express.static(__dirname + '/uploads'));

console.log("dirname : " + __dirname)
app.listen(port,() => {
    console.log("Server is running on "+port)
})


