const mongoose = require("mongoose");
const validator = require("validator")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Image = require('./image')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true

    },
    
    age :{
        type: Number,
        required: true,
        min: 10,
        max: 100
        
    },
    sex: {
        type: String,
        enum: ['M','F']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email is invalid")
            }
        }
    },
    
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("Password cannot contain password")
            }
        }
    },
    
    
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
    
},{
    timestamps: true  
})

userSchema.methods.getPublicProfile = function() {
    const profile = this
    const userObject = profile.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.generateAuthToken = async function() {
    const profile = this
    const token = jwt.sign({ _id: profile._id.toString() }, 'instagram',  {expiresIn: '30 minute'})

    profile.tokens = profile.tokens.concat({ token })
    await profile.save()
    return token
}

userSchema.methods.decoder = async function(token) {
    const decoded = jwt.verify(token, 'instagram')
    const user = await Profile.findOne({ _id: decoded._id , 'tokens.token' : token})
    if(!user) {
        throw new Error()
    }
    req.user = user
    console.log(token)

}

userSchema.statics.findByCredentials = async (username,password) => {
    const user =  await Profile.findOne({username});
    console.log(user)
    if(!user){
        throw new Error('User not found')
        // console.log("User not found")
    }

    const isMatch = await bcrypt.compare(password,user.password)
    //isMatch = true;
    if(!isMatch){
        throw new Error('Incorrect Password')
        //console.log("Incorrect password")
    }
    return user
}

// userSchema.pre('save',async function(next) {
//     const profile = this

//     if(profile.isModified('passwords')){
//         profile.password = await bcrypt.hash(profile.password,8)
//     }
//     next()
// })

userSchema.pre( 'remove' ,async function (next) {
    const user = this
    await Image.deleteMany({ owner: user._id}) 
    next()
})
const Profile = mongoose.model('profile',userSchema)

module.exports = Profile