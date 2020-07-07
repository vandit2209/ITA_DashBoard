const jwt = require('jsonwebtoken')
const Profile = require('../model/user')

const auth = async (req, res,next) => {
    //console.log(token)
    try {
            const token = req.cookies['Auth'].replace('Bearer ', '')
            //const token = token.
            const decoded = jwt.verify(token, 'covid19')
            const user = await Profile.findOne({ _id: decoded._id , 'tokens.token' : token})

            if(!user) {
                // throw new Error()
                req['not_found'] = true;
                next()
            }
            req.token = token
            req.user = user
            console.log(user.username)
            next()
    } catch (e) {
        req['not_found'] = true;
        // res.status(401).send({ error: 'Please Authenticate'});
        next()
    }
    
}

module.exports = auth