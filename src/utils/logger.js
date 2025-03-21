//  ______   __                      __                                  
// /      \ |  \                    |  \                                 
//|  $$$$$$\| $$  _______  ______  _| $$_     ______   ______   ________ 
//| $$__| $$| $$ /       \|      \|   $$ \   /      \ |      \ |        \
//| $$    $$| $$|  $$$$$$$ \$$$$$$\\$$$$$$  |  $$$$$$\ \$$$$$$\ \$$$$$$$$
//| $$$$$$$$| $$| $$      /      $$ | $$ __ | $$   \$$/      $$  /    $$ 
//| $$  | $$| $$| $$_____|  $$$$$$$ | $$|  \| $$     |  $$$$$$$ /  $$$$_ 
//| $$  | $$| $$ \$$     \\$$    $$  \$$  $$| $$      \$$    $$|  $$    \
// \$$   \$$ \$$  \$$$$$$$ \$$$$$$$   \$$$$  \$$       \$$$$$$$ \$$$$$$$$
//=======================================================================                                                                      
//● Crée par GalackQSM le 09 novembre 2019 Update and cover by LeZ in 2025
//● Serveur Discord: https://discord.gg/zch
//● Github: https://github.com/GalackQSM/Alcatraz                                                      
//=======================================================================                                                                      

const { createLogger, format, transports } = require('winston');
const path = require('path');

const logFormat = format.printf((info) => {
  const { timestamp, level, label, message, ...rest } = info;
  let log = `${timestamp} - ${level} [${label}]: ${message}`;

  if (!( Object.keys(rest).length === 0 && rest.constructor === Object )) {
    log = `${log}\n${JSON.stringify(rest, null, 2)}`.replace(/\\n/g, '\n');
  }
  return log;
});

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.errors({ stack: true }),
    format.label({ label: path.basename(process.mainModule.filename) }),
    format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' })
  ),
  transports: [ 
    new transports.Console({ 
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    new transports.File({ 
      filename: path.join(__basedir, 'logs/full.log'), 
      level: 'info',
      format: logFormat,
      options: { flags: 'w' } 
    }),
    new transports.File({ 
      filename: path.join(__basedir, 'logs/error.log'),
      level: 'warn',
      format: logFormat,
      options: { flags: 'w' }
    })
  ]
});

module.exports = logger;