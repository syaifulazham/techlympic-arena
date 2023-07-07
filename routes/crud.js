const auth = require('./auth');
var mysql = require('mysql');

let __DATA__SCHEMA__ = 'techlympic';

let API = {
    user:{
        login: (uid, pass, fn)=>{
            //console.log('Login as: ',uid,pass,auth.auth()[__DATA__SCHEMA__]);
            if(uid=='' || pass=='') return 0;
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try{
                //"SELECT * from peserta WHERE kp = ? and peserta_password = AES_ENCRYPT(kp,CONCAT(?,?))
                con.query("SELECT b.kodsekolah, b.namasekolah, b.peringkat, concat(alamat1,' ',alamat2,', ', poskod,' ', bandar,', ',negeri) alamat,a.* from peserta a left join user b using(usr_email) WHERE kp = ? and peserta_password = AES_ENCRYPT(?,CONCAT(kp,?))",[uid, pass, auth._SECRET_], 
                function (err, result) {
                    console.log('result ====> ', result);
                    if(result.length > 0){
                        var user = {
                            name: result[0].nama,
                            ic: result[0].kp,
                            kodsekolah: result[0].kodsekolah,
                            namasekolah: result[0].namasekolah,
                            darjah_tingkatan: result[0].darjah_tingkatan,
                            jantina: result[0].jantina,
                            peringkat: result[0].peringkat,
                            alamat: result[0].alamat,
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

