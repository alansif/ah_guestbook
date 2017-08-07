const sql = require('mssql');

const config253 = {
    user: 'sa',
    password: 'hxrt',
    server: '192.168.100.253',
    database: 'HZNewDB',
    options: {
        useUTC: false
    }
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
    const rip = req.headers['x-forwarded-for'] || req.ip || '';
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

const sql_getall = 'select * from (select ROW_NUMBER() over(order by time desc) as rn, * from ZZ_WebGuestMessage) t where rn between @b and @e';

app.get('/api/v1/guestbook/be', function(req, res){
    let pagesize = parseInt(req.query['pagesize']) || 10;
    let pageindex = parseInt(req.query['pageindex']) || 1;
    let b = (pageindex - 1) * pagesize + 1;
    let e = pageindex * pagesize;
    let f = async function(){
        try {
		let cr = await pool.request().query('select count(*) as total from ZZ_WebGuestMessage');
		let result = await pool.request()
		    .input('b', b)
		    .input('e', e)
		    .query(sql_getall);
		res.status(200).json({status:{code:0},data:result.recordset,summary:cr.recordset[0]});
	} catch(err) {
	    console.log(err);
	    res.status(500).json(err);
	}
    };
    f();
});

app.post('/api/v1/guestbook/be/:uid/state', function(req, res){
    let uid = req.params.uid || '';
    let state = req.body.value || '';
    if (uid.length === 0 || state.length === 0) {
        res.status(400).json({status:{code:400,description:'params error'}});
	return;
    }
    const sql_str = 'update ZZ_WebGuestMessage set state=@s where uid=@u';
    let f = async function(){
	try {
            let result = await pool.request()
	        .input('s', state)
	        .input('u', uid)
                .query(sql_str);
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
