const sql = require('mssql');

const config253 = {
    user: 'sa',
    password: 'hxrt',
    server: '192.168.100.253',
    database: 'HZNewDB'
};

sql.on('error', err => {
    console.log(err);
});

const pool = sql.connect(config253, function(err){
	if (err)
		console.log(err);
});

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length,Authorization,Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    if(req.method==="OPTIONS") res.sendStatus(200);/*让options请求快速返回*/
    else next();
});

const sql_leavemsg = 'insert into ZZ_WebGuestMessage(remoteip,username,phone,message,category) values(@rip,@name,@phone,@msg,@ctg)';

app.post('/api/v1/guestbook', function(req, res){
    const rip = req.ip || '';
    const name = req.body.username || '';
    const phone = req.body.phone || '';
    const msg = req.body.message || '';
    const ctg = req.body.category || '';
    let f = async function(){
        try {
            let result = await pool.request()
                .input('rip', rip)
                .input('name', name)
                .input('phone', phone)
                .input('msg', msg)
                .input('ctg', ctg)
                .query(sql_leavemsg);
            res.status(200).json({status:{code:0},data:result});
        } catch(err) {
            console.log(err);
            res.status(500).json(err);
        }
    };
    f();
});

app.use(function(req, res){
    console.log(req.headers);
    console.log(req.body);
    res.status(404).json({status:"Not found"});
});

const server = app.listen(8087, "0.0.0.0", function() {
    console.log('listening on port %d', server.address().port);
});
