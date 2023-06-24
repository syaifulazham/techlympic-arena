const auth = require('./auth');
var mysql = require('mysql');

let __DATA__SCHEMA__ = 'techlympic';

let API = {
    user:{
        login: (uid, pass, fn)=>{
            if(uid=='' || pass=='') return 0;
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try{
                con.query("SELECT * from peserta WHERE kp = ? and peserta_password = AES_ENCRYPT(?,CONCAT(?,?))",[uid, pass, uid, auth._SECRET_], 
                function (err, result) {
                    if(result.length > 0){
                        var user = {
                            name: result[0].nama,
                            ic: result[0].kp,
                            avatar: ''
                        };
                        
                        fn({
                            authorized: true,
                            msg: 'User Authorized!',
                            data: user
                        });
                    }else {
                        fn({
                            authorized: false,
                            msg: 'Incorrect Username of Password',
                            data: []
                        })
                    }
                });
            } catch(e){
                console.log(e);
            }
        },
    }
}

module.exports = API;

