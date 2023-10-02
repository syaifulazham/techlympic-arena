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
                con.query(`SELECT b.kodsekolah, b.namasekolah, if(YEAR(tarikh_lahir)>=2005 and YEAR(tarikh_lahir)<=2010,'Menengah',
                if(YEAR(tarikh_lahir)>=2011,'Rendah','Belia')) peringkat, concat(alamat1,' ',alamat2,', ', poskod,' ', bandar,', ',negeri) alamat,
                if(ucase(darjah_tingkatan) REGEXP '1|SATU|TINGKATAN SA' OR LEFT(kp,2)='10',if(b.peringkat='Menengah' OR LEFT(kp,2)='10','T1','D1'),
                if(ucase(darjah_tingkatan) REGEXP '2|DUA|TINGKATAN DU' OR LEFT(kp,2)='09',if(b.peringkat='Menengah' OR LEFT(kp,2)='09','T2','D2'),
                if(ucase(darjah_tingkatan) REGEXP '3|TIGA|TINGKATAN TI' OR LEFT(kp,2)='08',if(b.peringkat='Menengah' OR LEFT(kp,2)='08','T3','D3'),
                if(ucase(darjah_tingkatan) REGEXP '4|EMPAT|TINGKATAN EM' OR LEFT(kp,2)='07',if(b.peringkat='Menengah' OR LEFT(kp,2)='07','T4','D4'),
                if(ucase(darjah_tingkatan) REGEXP '5|LIMA|TINGKATAN LI' OR LEFT(kp,2)='06',if(b.peringkat='Menengah' OR LEFT(kp,2)='06','T5','D5'),'D6'))))) grade,
                a.* from peserta a left join user b using(usr_email) WHERE kp = ? and peserta_password = AES_ENCRYPT(?,CONCAT(kp,?))`,[uid, pass, auth._SECRET_], 
                function (err, result) {
                    console.log('result ====> ', result);
                    if(result !== undefined){
                        var user = {
                            name: result[0].nama,
                            ic: result[0].kp,
                            kodsekolah: result[0].kodsekolah,
                            namasekolah: result[0].namasekolah,
                            darjah_tingkatan: result[0].darjah_tingkatan,
                            grade: result[0].grade,
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
                SELECT a.*,prog_code,theme, color, target_group, prog_desc
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
    quiz:{
        list(p,g, fn){
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try {
                con.query(`
                select sha(concat(id,'${auth._SECRET_}')) idx,a.* from quiz_sets a where target_group = ? and if(target_grade<>'',target_grade=?,true) and ispublished = 1 order by updatedate
            `, [p,g],function (err, result) {
                    if (err) {
                        console.log('but with some error: ',err);
                    } else {
                        console.log('... with some data: ',result);
                        con.end();
                        
                        fn(result);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        quiz(p, kp, fn){
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try {
                //timestamp(CONVERT_TZ(b.createdate, 'America/New_York', 'Asia/Kuala_Lumpur'))
                con.query(`
                    SELECT kp,a.*,ifnull(b.questions_queue,a.questions) questions_queue,markah,timetaken,b.createdate lastupdate, ifnull(b.last_index,-1) last_index 
                    FROM quiz_sets a 
                    LEFT JOIN ( SELECT * from quiz_answer WHERE kp = ?) b ON a.id = b.quizid
                    where sha(concat(id,'${auth._SECRET_}')) = ?
            `,[kp, p],function (err, result) {
                    if (err) {
                        console.log('but with some error: ',err);
                    } else {
                        console.log('... with some data: ',result);
                        con.end();
                        
                        fn(result);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        questionsSet(series, fn){
            if(series.length===0)
                series='0';
                
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try {
                //console.log(`select qid,theme,sub_theme,question,objective_options from quiz_collections where qid in(${series})`)
                con.query(`
                select qid,theme,sub_theme,question,objective_options from quiz_collections where qid in(${series})
                order by field(qid,${series})
              `, series.split(','), function (err, result) {
                    if (err) {
                        console.log('but with some error: ',err);
                    } else {
                        console.log('... with some data: ',result);
                        con.end();
                        
                        fn(result);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        answer(quizid, kp, questions_queue, newanswer, lastindex, fn){
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try {
                con.query(`
                    INSERT INTO quiz_answer (quizid, kp, questions_queue, answers)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    answers = if(timetaken is null,concat(if(LENGTH(answers)=0,'',concat(answers,'|')),?),answers),
                    last_index = if(timetaken is null,?,last_index)
                `, [quizid*1, kp, questions_queue, newanswer, newanswer, lastindex], function (err, result) {
                    if (err) {
                        console.log('but with some error: ', err);
                    } else {
                        console.log('... with some data: ', result);
                        con.end();
                        fn(result);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        completeAnswer(quizid, kp, size, fn){
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            var rows = 'SELECT 0 AS digit UNION ALL ';
            for(i=1;i<=size-1;i++){
                rows += `SELECT ${i} UNION ALL `;
            }
            rows += `SELECT ${size} `;

            var sqlstr = `
            UPDATE quiz_answer a,
            (SELECT
                quizid,kp,
                TIMESTAMPDIFF(MINUTE, MIN(createdate), MAX(updatedate)) + 
            TIMESTAMPDIFF(SECOND, MIN(createdate), MAX(updatedate)) / 60.0 AS timetaken,
            SUM(markah) markah
            FROM (
            SELECT quizid,kp,g.qid,answer,correct_answer, createdate, updatedate, if(answer=correct_answer,1,0) markah
            FROM 
            (SELECT
                quizid,
                kp,
            CAST(SUBSTRING_INDEX(answer, ',', 1) AS INT) AS qid,
            SUBSTRING_INDEX(answer, ',', -1) AS answer,
                createdate,
                updatedate
            FROM
                (SELECT
                        quizid,
                        kp,
                        SUBSTRING_INDEX(SUBSTRING_INDEX(answers, '|', n.digit + 1), '|', -1) AS answer,
                        createdate,
                        updatedate
                    FROM
                        quiz_answer
                    JOIN (
                        ${rows}
                    ) AS n
                    ON
                        LENGTH(answers) - LENGTH(REPLACE(answers, '|', '')) >= n.digit
                    WHERE
                        quizid = ? AND kp = ?
                    ORDER BY
                        quizid, kp, answer
                ) m ) g
                LEFT JOIN 
                (select qid, correct_answer from quiz_collections where qid IN (
                    SELECT
                        SUBSTRING_INDEX(SUBSTRING_INDEX(questions, ',', n.digit + 1), ',', -1) AS answer
                    FROM
                        quiz_sets
                    JOIN (
                        ${rows}
                    ) AS n
                    ON
                        LENGTH(questions) - LENGTH(REPLACE(questions, ',', '')) >= n.digit
                    WHERE
                        id = ?
                    ) 
                ) h USING(qid)
                ) z) b
                SET
                a.timetaken = b.timetaken,
                a.markah = b.markah
                WHERE
                a.quizid = b.quizid AND a.kp = b.kp and a.timetaken is null
            `;
            try {
                con.query(sqlstr, [quizid*1, kp, quizid*1], function (err, result) {
                    if (err) {
                        console.log('but with some error: ', err);
                    } else {
                        console.log('... with some data: ', result);
                        con.end();
                        fn(result);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        myResult(quizid, kp, fn){
            var con = mysql.createConnection(auth.auth()[__DATA__SCHEMA__]);
            try {
                con.query(`
                SELECT a.*,
                FLOOR((timetaken/60)) AS hours,
                FLOOR(((timetaken/60) - FLOOR((timetaken/60))) * 60) AS minutes,
                ROUND(((timetaken/60) - FLOOR((timetaken/60))) * 3600 % 60) AS seconds  
                FROM quiz_answer a
                WHERE quizid = ? AND kp = ?
                `, [quizid*1, kp], function (err, result) {
                    if (err) {
                        console.log('but with some error: ', err);
                    } else {
                        console.log('... with some data: ', result);
                        con.end();
                        fn(result);
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
    }
}

module.exports = API;

