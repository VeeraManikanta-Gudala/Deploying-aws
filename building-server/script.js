const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
var mime = require('mime-types');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'AKIAXYKJXH2GLHVFXQ6W',
        secretAccessKey: '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'
    }
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
    console.log("executing script.js");

    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on('data', function(data) {
        console.log(data.toString());
    });

    p.stderr.on('data', function(data) {
        console.log("Error:", data.toString());
    });

    p.on('close', async function() {
        console.log('Build complete');
        const distFolderPath = path.join(__dirname, 'output', 'dist');
        const distFolderContent = fs.readdirSync(distFolderPath, { recursive: true });

        for (const file of distFolderContent) {
            const filePath = path.join(distFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log(`Uploading ${filePath}`);

            const command = new PutObjectCommand({
                Bucket: 'deploying-outpurs-1-clone',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath)
            });
            await s3Client.send(command);
        }
        console.log("Done");
    });
}

init();
