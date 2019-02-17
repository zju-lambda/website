const express = require('express')
const cp = require('child_process')
const os = require('os')
const fs = require('fs')
const app = express()
const port = 3000
const blog_repo = 'https://github.com/zju-lambda/hexo-blog.git';
const slides_repo = 'https://github.com/zju-lambda/slides.git';

function exec(cmd) {
    console.log('[Exec] ' + cmd)
    cp.execSync(cmd);
}

function init() {
    exec(`git clone ${slides_repo}`);
    exec(`git clone ${blog_repo}`);
    exec('cd hexo-blog && npm install && npm uninstall hexo-renderer-marked --save && npm install hexo-renderer-kramed --save && cp ../patch/inline.js node_modules/kramed/lib/rules && node node_modules/hexo/bin/hexo generate');
}

function update() {
    exec('cd slides && git pull');
    exec('cd hexo-blog && git pull && npm install &&  && node node_modules/hexo/bin/hexo generate');
}

index = {};

function build_index() {
    index = {};
    let posts = fs.readdirSync('hexo-blog/source/_posts');
    posts.forEach(post => {
        let filename = `hexo-blog/source/_posts/${post}`;
        console.log(`[Scan] ${filename}`);
        let data = fs.readFileSync(filename).toString();
        let lines = data.split("\n");
        for (i = 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line.startsWith("---")) {
                break;
            } else {
                let s = line.split(":");
                let key = s[0].trim();
                if (key == "redirect") {
                    let value = s.slice(1).join(":").trim();
                    index[post.split('.')[0]] = value;
                }
            }
        }
    });
    console.log(index);
}

if (!fs.existsSync('hexo-blog')) {
    init();
}
build_index();

//app.get('/', (req, res) => res.send('Hello World!'))
app.get('/[0-9]*/[0-9]*/[0-9]*/', function (req, res, next) {
    let name = req.path.match("/[0-9]*/[0-9]*/[0-9]*/(.*)/$")[1];
    console.log(`[Get] ${name}`);
    if (index[name]) {
        let url = index[name];
        res.redirect(302, url);
    } else {
        next();
    }
});

app.use(express.static('hexo-blog/public'));
app.use('/slides', express.static('slides'));

app.post('/github', function (req, res) {
    update();
    build_index();
    res.status(201).end();
});

app.listen(port, () => console.log(`[Log] listening on port ${port}`))