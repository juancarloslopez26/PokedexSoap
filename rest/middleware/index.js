module.exports = (req, res, next)=>{
    return res.status(200).json({code: 200, message: "Bienvenido a la Pokedex"})
}
