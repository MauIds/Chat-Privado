const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', async (req, res) => {
  const { password } = req.body;

  try {
    // Buscar usuarios
    const users = await User.find();
    
    // Verificar si algún usuario coincide con la contraseña
    for (const user of users) {
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (isMatch) {
        const payload = {
          user: {
            id: user.userId,
            name: user.name
          }
        };

        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '24h' },
          (err, token) => {
            if (err) throw err;
            return res.json({ 
              token,
              userId: user.userId,
              userName: user.name
            });
          }
        );
        return;
      }
    }

    return res.status(400).json({ msg: 'Contraseña incorrecta' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// @route   GET api/auth/partner/:userId
// @desc    Obtener información del otro usuario
// @access  Private
router.get('/partner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Encontrar al otro usuario (que no sea el actual)
    const partner = await User.findOne({ userId: { $ne: userId } });
    
    if (!partner) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    res.json({ 
      partnerId: partner.userId,
      partnerName: partner.name 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;