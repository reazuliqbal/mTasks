module.exports = {
    isAuthenticated : (req, res, next) => {
        if (req.session.user) {
            return next();
        } else {
            res.redirect('/connect');
        }
    },

    isAdmin : (req, res, next) => {
        if (req.session.admin) {
            return next();
        } else {
            res.redirect('/connect');
        }
    }
}