const githubConfig = {
    owner: '', // GitHub username
    repo: '',  // Repository name
    branch: 'main',
    token: ''  // Personal access token with repo scope
};

function githubEnabled() {
    return githubConfig.owner && githubConfig.repo && githubConfig.token;
}

async function loadGitHubJson(path) {
    if (!githubEnabled()) {
        return null;
    }
    const url = `https://raw.githubusercontent.com/${githubConfig.owner}/${githubConfig.repo}/${githubConfig.branch}/${path}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        return null;
    }
    return resp.json();
}

async function saveGitHubJson(path, data, message = 'Update data') {
    if (!githubEnabled()) {
        console.error('GitHub configuration missing.');
        return false;
    }
    const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}`;
    const headers = { 'Authorization': `token ${githubConfig.token}` };
    const getResp = await fetch(apiUrl, { headers });
    let sha = null;
    if (getResp.ok) {
        const j = await getResp.json();
        sha = j.sha;
    }
    const body = {
        message,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
        branch: githubConfig.branch
    };
    if (sha) body.sha = sha;
    const putResp = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    return putResp.ok;
}
