const nodemailer = require("nodemailer")
const core = require("@actions/core")
const fs = require("fs")
const showdown = require("showdown")

function getBody(bodyOrFile, convertMarkdown) {
    let body = bodyOrFile

    // Read body from file
    body = getFromFile(bodyOrFile)

    // Convert Markdown to HTML
    if (convertMarkdown) {
        const converter = new showdown.Converter()
        body = converter.makeHtml(body)
    }

    return body
}

function getFrom(from, username) {
    if (from.match(/.+ <.+@.+>/)) {
        return from
    }

    return `"${from}" <${username}>`
}

function getFromFile(arg) {
    if (arg.startsWith("file://")) {
        const file = arg.replace("file://", "")
        try {
            return fs.readFileSync(file, "utf8")
        } catch (e) {
            console.log(e)
            return "[Error]File:" + file + " non-exist!"
        }
    }
    return arg
}

async function main() {
    try {
        const serverAddress = core.getInput("server_address", {
            required: false
        })
        const serverPort = core.getInput("server_port", {
            required: false
        })
        const username = core.getInput("username", {
            required: true
        })
        const password = core.getInput("password", {
            required: true
        })
        const subject = core.getInput("subject", {
            required: true
        })
        const from = core.getInput("from", {
            required: true
        })
        const to = core.getInput("to", {
            required: true
        })
        const secure = core.getInput("secure", {
            required: false
        })
        const body = core.getInput("body", {
            required: false
        })
        const htmlBody = core.getInput("html_body", {
            required: false
        })
        const cc = core.getInput("cc", {
            required: false
        })
        const bcc = core.getInput("bcc", {
            required: false
        })
        const replyTo = core.getInput("reply_to", {
            required: false
        })
        const attachments = core.getInput("attachments", {
            required: false
        })
        const convertMarkdown = core.getInput("convert_markdown", {
            required: false
        })
        const ignoreCert = core.getInput("ignore_cert", {
            required: false
        })

        const transport = nodemailer.createTransport({
            host: serverAddress ? serverAddress : "smtp." + username.substring(username.indexOf("@") + 1),
            port: serverPort ? serverPort : 465,
            secure: secure || !serverPort ? true : serverPort == 465,
            auth: {
                user: username,
                pass: password,
            },
            tls: ignoreCert ? {
                rejectUnauthorized: false
            } : undefined
        })

        const info = await transport.sendMail({
            from: getFrom(from, username),
            to: to,
            subject: getFromFile(subject),
            cc: cc ? cc : undefined,
            bcc: bcc ? bcc : undefined,
            replyTo: replyTo ? replyTo : undefined,
            text: body ? getBody(body, false) : undefined,
            html: htmlBody ? getBody(htmlBody, convertMarkdown) : undefined,
            attachments: attachments ? attachments.split(',').map(f => ({
                path: f.trim()
            })) : undefined
        })
    } catch (error) {
        console.log(error)
        core.setFailed(error.message)
    }
}

main()