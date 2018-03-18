let config = {
    port: 3000,
    auth: {
        client_id: 'micro.app',
        redirect_uri: 'https://steemmtask.herokuapp.com/connect'
    },
    session: {
        secret: 'Relation39Orbiting53ridges'
    },
    order: {
        redirect_uri: 'https://steemmtask.herokuapp.com/order/complete'
    },
    site: {
        agent_fee: 0.100,
        agent_account: 'steembangladesh',
        app_name: 'mTasks/0.1',
        category: 'mtasks' // Steemit main tag
    }
};

module.exports = config;