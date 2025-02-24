
const authMiddleware = (req, res, next) => {
    if (!req.cookies.userId) {
        return res.redirect("/login"); 
    }
    next();
};



module.exports = authMiddleware;