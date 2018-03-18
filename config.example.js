let config = {
    port: 3000,
    auth: {
        client_id: 'steem.app', // SteemConnect app name
        redirect_uri: 'https://steemmtask.herokuapp.com/connect' // SteemConnect redirect URL
    },
    session: {
        secret: 'keep_it_secure_and_secret'
    },
    site: {
        agent_fee: 0.100, // Sites fee for every order
        agent_account: 'agent', // Agent account name
        app_name: 'mTasks/0.1', // Application name
        category: 'mtasks' // Steemit main tag
    }
};

module.exports = config;