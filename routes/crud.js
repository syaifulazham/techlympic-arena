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

                        con.end();
                        
                        fn({
                            authorized: true,
                            msg: 'User Authorized!',
                            data: user
                        });
                    }else {
                        con.end();

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
        competitions: (uid, fn)=>{
            try{
                //console.log('Login as: ',uid,pass,auth.auth()[__DATA__SCHEMA__]);
                if(uid=='') return 0;
                var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);

                var sqlstr = `
                SELECT a.*,prog_code,theme, color, target_group
                FROM (
                SELECT * FROM(
                SELECT kp, SUBSTRING_INDEX(SUBSTRING_INDEX(program, '|', n), '|', -1) AS prog_name, 'Sekolah' peringkat
                FROM peserta
                JOIN (
                    SELECT 1 AS n
                    UNION ALL SELECT 2
                    UNION ALL SELECT 3
                    UNION ALL SELECT 4
                    UNION ALL SELECT 5
                    UNION ALL SELECT 6
                    UNION ALL SELECT 7
                    UNION ALL SELECT 8
                    UNION ALL SELECT 9
                    UNION ALL SELECT 10
                    UNION ALL SELECT 11
                    UNION ALL SELECT 12
                    UNION ALL SELECT 13
                    UNION ALL SELECT 14
                    UNION ALL SELECT 15
                    UNION ALL SELECT 16
                ) AS numbers
                ON CHAR_LENGTH(program) - CHAR_LENGTH(REPLACE(program, '|', '')) >= n - 1
                WHERE kp = ?) v
                UNION 
                SELECT kp, program prog_name, 'Negeri' peringkat FROM peserta_negeri WHERE kp = ?

                ) a
                LEFT JOIN program b USING(prog_name)
                `;

                con.query(sqlstr, [uid,uid], (err, result)=>{
                    console.log(result);
                    if(err){
                        console.log('Error competitions: ', err);
                        fn([])
                    }

                    con.end();

                    fn(result);
                });
            }catch(err){
                console.log('Error competitions: ', err);
            }
        }

    },
}

module.exports = API;

