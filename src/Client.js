
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
                                                                       
const { Client, Collection, EmbedBuilder } = require('discord.js');
const { readdir, readdirSync } = require('fs');
const { join, resolve } = require('path');
const AsciiTable = require('ascii-table');
const { fail } = require('./utils/emojis.json');

class AlcatrazClient extends Client {
 constructor(config, options = {}) {  
    super(options);
    this.logger = require('./utils/logger.js');
    this.db = require('./utils/db.js');
    this.types = {
      INFO: 'Informations',
      FUN: 'Fun',
      COULEUR: 'Couleurs',
      POINTS: 'Points',
      GENERAL: 'Général',
      NFSW: 'NFSW',
      JEUX: 'Jeux',
      ECONOMY: 'Economie',
      LEVEL: 'Niveau',
      AVATAR: 'Avatar',
      BACKUP: 'Backup',
      MOD: 'Modération',
      ANTIRAID: 'Anti-Raid',
      ADMIN: 'Administration',
      OWNER: 'Propriétaire'
    };
    this.commands = new Collection();
    this.aliases = new Collection();
    this.token = config.token;
    this.apiKeys = config.apiKeys;
    this.ownerId = config.ownerId;
    this.bugReportChannelId = config.bugReportChannelId;
    this.utils = require('./utils/utils.js');
    this.logger.info('Initialisation du client Alcatraz v14...');
  }

  loadEvents(path) {
    readdir(path, (err, files) => {
      if (err) this.logger.error(err);
      files = files.filter(f => f.split('.').pop() === 'js');
      if (files.length === 0) return this.logger.warn('Aucun événement trouvé');
      this.logger.info(`${files.length} événement(s) trouvé(s)...`);
      files.forEach(f => {
        const eventName = f.substring(0, f.indexOf('.'));
        const event = require(resolve(__basedir, join(path, f)));
        this.on(eventName, event.bind(null, this));
        this.logger.info(`Chargement de l'événement: ${eventName}`);
      });
    });
    return this;
  }

  loadCommands(path) {
    this.logger.info('Chargement des commandes...');
    let table = new AsciiTable('Commandes');
    table.setHeading('Fichiers', 'Aliases', 'Catégories', 'Statut');
    readdirSync(path).filter(f => !f.endsWith('.js')).forEach(dir => {
      const commands = readdirSync(resolve(__basedir, join(path, dir))).filter(f => f.endsWith('js'));
      commands.forEach(f => {
        const Command = require(resolve(__basedir, join(path, dir, f)));
        const command = new Command(this); 
        if (command.name && !command.disabled) {
          this.commands.set(command.name, command);
          let aliases = '';
          if (command.aliases) {
            command.aliases.forEach(alias => {
              this.aliases.set(alias, command);
            });
            aliases = command.aliases.join(', ');
          }
          table.addRow(f, aliases, command.type, 'pass');
        } else {
          table.addRow(f, '', '', 'fail');
        }
      });
    });
    this.logger.info(`\n${table.toString()}`);
    return this;
  }

  isOwner(user) {
    return user.id === this.ownerId;
  }

  sendSystemErrorMessage(guild, error, errorMessage) {
    const systemChannelId = this.db.settings.selectSystemChannelId.pluck().get(guild.id);
    const systemChannel = guild.channels.cache.get(systemChannelId);

    if (!systemChannel || !systemChannel.viewable) return;

    const embed = new EmbedBuilder()
      .setAuthor({ name: this.user.tag, iconURL: this.user.displayAvatarURL() })
      .setTitle(`${fail} Erreur système: \`${error}\``)
      .setDescription(`\`\`\`diff\n- Défaillance du système\n+ ${errorMessage}\`\`\``)
      .setTimestamp()
      .setColor('#FF0000');
    systemChannel.send({ embeds: [embed] });
  }
}

module.exports = AlcatrazClient;
