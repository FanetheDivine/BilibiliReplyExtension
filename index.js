const aid = (() => {
    var table = "fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF";
    var tr = {};
    for (let i = 0; i < 58; i++) {
        tr[table[i]] = i;
    }
    var s = [11, 10, 3, 8, 4, 6];
    var xor = 177451812,
        add = 8728348608;
    const bvid = document.querySelector(`meta[itemprop="url"]`).content.split('/')[4]
    var r = 0;
    for (let i = 0; i < 6; i++)
        r += tr[bvid[s[i]]] * Math.pow(58, i);
    return (r - add) ^xor;
})()
function subreplyformat(item) {
    const { uname, mid: uid } = item.member
    const subreply = item.content.message
    subreply.replace('\n', '\n  ')
    return `    ${uname} UID ${uid} 点赞${item.like ? item.like : 0}\n        ${subreply}`
}
async function getSubReplies(csrf, oid, pn, ps, root, type) {
    //csrf 意义不明
    //oid 视频av号 即上面求得的aid
    //pn 子评论页码号
    //ps 每页评论的数量 默认1
    //root 对应根评论的id
    //type 意义不明 默认1
    try {
        let { page, replies: subreplies, root: rootreply } = await fetch(`https://api.bilibili.com/x/v2/reply/reply?csrf=${csrf}&oid=${oid}&pn=${pn}&ps=${ps}&root=${root}&type=${type}`).then(res => res.json()).then(json => json.data)
        if (!subreplies)
            return
        const subreplyarr = subreplies.map(subreplyformat)
        if (pn * ps < page.count)
            return [...subreplyarr, ...(await getSubReplies(csrf, oid, pn + 1, ps, root, type))]
        else
            return [...subreplyarr, rootreply.like]
    } catch (e) {
        console.log(e)
        alert(`插件BiliBiliReplyExtension执行异常`)
    }
}
document.addEventListener('mouseover', e => {
    if (e.target.className === 'reply-content-container root-reply') {
        clearTimeout(e.target.dataset.timer2)
        if (!e.target.dataset.timer1) {
            e.target.dataset.timer1 = setTimeout(() => {
                let button = e.target.appendChild(document.createElement('div')).appendChild(document.createElement('button'))
                button.innerText = `提取评论`
                button.addEventListener('click', () => {
                    const userDom = e.target.parentElement.parentElement.querySelector('.user-name')
                    const uid = userDom.dataset.userId
                    const uname = userDom.innerText
                    const root = userDom.dataset.rootReplyId
                    const rootreplytext = e.target.querySelector('.reply-content').innerText
                    getSubReplies('', aid, 1, 10, root, 1)
                        .then(arr => {
                            let str = ''
                            if (arr === undefined) {
                                const like = e.target.parentElement.querySelector('.reply-like').innerText
                                str = `${uname} UID ${uid} 点赞${like ? like : 0}\n  ${rootreplytext}`
                            }
                            else {
                                let subreplyarr = arr.slice(0, arr.length - 1)
                                const rootreply =
                                    `${uname} UID ${uid} 点赞${arr[arr.length - 1] ? arr[arr.length - 1] : 0}\n  ${rootreplytext}`
                                str = [rootreply, ...subreplyarr].join('\n')
                            }
                            navigator.clipboard.writeText(str)
                        })
                        .then(() => alert(`评论已提取至剪贴板`))
                })
                e.target.addEventListener('mouseleave', function leave2() {
                    this.dataset.timer2 = setTimeout(() => {
                        this.querySelector('div')?.remove()
                        delete this.dataset.timer2
                        this.removeEventListener('mouseleave', leave2)
                    }, 500)//鼠标离开500ms按钮消失
                })
            }, 200)//鼠标悬停200ms出现按钮
            e.target.addEventListener('mouseleave', function leave1() {
                clearTimeout(this.dataset.timer1)
                delete e.target.dataset.timer1
                this.removeEventListener('mouseleave', leave1)
            })
        }
    }
})