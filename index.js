const fs = require('fs');
const commander = require('commander')
const FormData = require('form-data');
const path = require('path')
const { token, getToken } = require('./auth.js')
const axios = require('axios');
const creds = require('./credentials.json')

const program = new commander.Command();

async function fileUpload(options) {
    const projectId = creds.projectId
    const accessToken = await token()

    const stringUpload = async (event, context) => {
        const stringForm = new FormData();
        stringForm.append('file', fs.createReadStream(`./${options.file}`))
        stringForm.append('fileUri', `${options.file}`)
        stringForm.append('fileType', `${options.contentType}`)
        stringForm.append('smartling.placeholder_format_custom', '\\{\\{.+?\\}\\}')
        try {
            const headers = {
                headers: {
                    ...stringForm.getHeaders(),
                    Authorization: `Bearer ${accessToken}`,
                    "content-type": "multipart/form-data"
                }
            }
            const response = await axios.postForm(`https://api.smartling.com/files-api/v2/projects/${projectId}/file`, stringForm, headers)
            console.log(response.data.response);
            return response
        } catch (error) {
            console.error(`There was an error: ${error}`)
        }
    }


    const contextUpload = async (event, context) => {
        console.log('context upload', options);
        const file = fs.createReadStream(`./${options.file}`)
        const contentType = options.contentType.toUpperCase()
        const contextForm = new FormData()
        contextForm.append('name', `${contentType}`)
        contextForm.append('content', file)
        try {
            const headers = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "content-type": `${options.contentType}`
                }
            }
            const response = await axios.post(`https://api.smartling.com/context-api/v2/projects/${projectId}/contexts`, contextForm, headers)
            if (response.data.response.code === 'SUCCESS') {
                console.log(response.data.response);
            } else {
                console.log(response.data.response);
            }
        } catch (error) {
            console.error(`There was a context upload error: ${error}`);
        }
    }

    switch (options.fileType) {
        case 'strings':
            stringUpload()
            break;
        case 'context':
            contextUpload()
            break;
        default:
            console.log('invalid file type specified');
    }
}


async function download(options) {
    const projectId = creds.projectId
    const fileName = options.file
    const translationDownload = async (event, context) => {
        console.log('firing translation download');
        try {
            const token = await getToken()
            const response = await axios.get(`https://api.smartling.com/files-api/v2/projects/${projectId}/locales/all/file/zip`, {
                params: {
                    fileUri: fileName
                },
                responseType: 'stream',
                headers: { Authorization: `Bearer ${token}` },
            });
            const savePath = path.join(__dirname, 'translations.zip')
            const writer = fs.createWriteStream(savePath)
            response.data.pipe(writer)

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log('File downloaded successfully.');
        } catch (error) {
            console.error(`There was an error: ${error}`);
        }
    }
    translationDownload(options)
}

program
    .command('fileUpload')
    .option('-t, --fileType <fileType>', 'Specify the fileType')
    .option('-f, --file <file>', 'Specify the file to upload')
    .option('-c, --contentType <contentType>', 'For context specify the context type')
    .action((options) => {
        fileUpload(options);
    });

program
    .command('translationDownload')
    .description('Download translations')
    .option('-f, --file <file>', 'Specify the file to download')
    .action((options) => {
        download(options);
    });

program
    .command('getToken')
    .description('Get a token')
    .action(getToken);

program.parse(process.argv);
