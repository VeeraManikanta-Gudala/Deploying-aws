const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 9000;
const ecsclient = new ECSClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'AKIAXYKJXH2GLHVFXQ6W',
        secretAccessKey: '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'
    }
});

const config = {
    CLUSTER: "arn:aws:ecs:us-east-1:533267431052:cluster/builder-cluster-deplou",
    TASK: "arn:aws:ecs:us-east-1:533267431052:task-definition/builder-task"
};

app.post('/project', async (req, res) => {
    const { gitURL } = req.body;

    if (!gitURL) {
        return res.status(400).json({ error: 'gitURL is required.' });
    }

    const projectSlug = generateSlug();

    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['subnet-08b754e81721dceef', 'subnet-07dc505a1f2e41a92', 'subnet-092cde927d584e4c9'],
                securityGroups: ['sg-028bfcc2ecf2c8bbc'],
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: "builder-Image",
                    environment: [
                        { name: 'GIT_REPO_URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
        }
    });

    try {
        await ecsclient.send(command);
        return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } });
    } catch (error) {
        console.error('Error starting ECS task:', error);
        return res.status(500).json({ error: 'Failed to start ECS task.', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Reverse proxy running on ${PORT}`));
