
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
//● Créé par GalackQSM le 09 novembre 2019
//● Serveur Discord: https://discord.gg/zch
//● Github: https://github.com/GalackQSM/Alcatraz                                                      
//=======================================================================

const config = require('./config.json');
const Client = require('./src/Client.js');
const { GatewayIntentBits, Collection, EmbedBuilder, Partials } = require('discord.js');
const Discord = require('discord.js');
const DBL = require('dblapi.js');
const fetch = require('node-fetch');
const { GiveawaysManager } = require('discord-giveaways');
const moment = require('moment');
const fs = require('fs');
const db = require('quick.db');
const BOATS = require('boats.js');

// Ajustements des seuils d'affichage pour Moment.js
moment.relativeTimeThreshold('s', 60);
moment.relativeTimeThreshold('ss', 5);
moment.relativeTimeThreshold('m', 60);
moment.relativeTimeThreshold('h', 60);
moment.relativeTimeThreshold('d', 24);
moment.relativeTimeThreshold('M', 1);

// Rendre __dirname disponible globalement
global.__basedir = __dirname;

// Initialisation du client personnalisé avec GatewayIntentBits (v14)
const client = new Client(config, { 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent // Indispensable pour lire les commandes
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const prefix = config.prefix || '!';

function init() {
  client.loadEvents('./src/events');
  client.loadCommands('./src/commands');
  client.login(client.token);
}

init();

/* ===========================
   LOGIQUE POUR GUILD CREATE
   =========================== */
client.on('guildCreate', async guild => {
  let canal = client.channels.cache.get('877212912966594591');
  if (!canal) return;

  const owner = await guild.fetchOwner();

  const embed = new EmbedBuilder()
    .setThumbnail(guild.iconURL())
    .setTitle('`➕` ' + config.NomBot + ' a rejoint un serveur')
    .setDescription(
      `Merci à **${owner.user.tag}** de m'avoir ajouté dans son serveur, ` +
      `je suis maintenant dans **${client.guilds.cache.size} serveurs**.\n\n__Informations du serveur :__\n` +
      `• :pencil: **Nom:** ${guild.name}\n` +
      `• :mortar_board: **Rôles:** ${guild.roles.cache.size}\n` +
      `• :man_detective: **Membres:** ${guild.memberCount}\n` +
      `• :id: **ID:** ${guild.id}\n` +
      `• :crown: **Propriétaire:** ${owner.user.tag}`
    )
    .setTimestamp()
    .setColor('#1fd10f')
    .setFooter({ text: config.footer });

  canal.send({ embeds: [embed] });
});

/* ===========================
   LOGIQUE POUR GUILD DELETE
   =========================== */
client.on('guildDelete', async guild => {
  let canal = client.channels.cache.get('877212912966594591');
  if (!canal) return;

  // On essaie de récupérer l'owner s'il est encore en cache, sinon on affiche l'ID
  const ownerTag = guild.ownerId;

  const embed = new EmbedBuilder()
    .setThumbnail(guild.iconURL())
    .setTitle('`➖` ' + config.NomBot + ' a quitté un serveur')
    .setDescription(
      `Dommage, j'ai été exclu d'un serveur, ` +
      `je ne suis plus que dans **${client.guilds.cache.size} serveurs**.\n\n__Informations du serveur :__\n` +
      `• :pencil: **Nom:** ${guild.name}\n` +
      `• :id: **ID:** ${guild.id}\n` +
      `• :crown: **ID Propriétaire:** ${ownerTag}`
    )
    .setTimestamp()
    .setColor('#d90e0b')
    .setFooter({ text: config.footer });

  canal.send({ embeds: [embed] });
});

/* ===========================
   FILTRE ANTI-INSULTE
   =========================== */
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  const content = message.content.toLowerCase();
  const hasDirectInsulte = config.ANTI_INSULTE.some(word => content.includes(word.toLowerCase()));
  
  if (hasDirectInsulte) {
    const antiinsulte = new EmbedBuilder()
      .setTitle(':no_entry: Filtre anti-insulte détecté')
      .setDescription(`**${message.author.username}**, merci de ne pas utiliser d'insultes.`)
      .setTimestamp()
      .setColor('#2f3136')
      .setFooter({ text: config.footer });
    
    message.channel.send({ embeds: [antiinsulte] }).then(msg => {
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    });
    message.delete().catch(() => {});
  }
});

/* ===========================
   TOP.GG
   =========================== */
if (config.Topgg && config.Topgg !== "") {
  const dbl = new DBL(config.Topgg, client);
  dbl.on('posted', () => console.log('Stats publiées sur Top.gg'));
}

/* ===========================
   VOIDBOTS & AUTRES (Squelette v14)
   =========================== */
// Ces appels API restent similaires mais vérifiez les tokens dans config.json

/* ===========================
   GESTIONNAIRE DE GIVEAWAYS
   =========================== */
class GiveawayManagerWithOwnDatabase extends GiveawaysManager {
  async getAllGiveaways() { return db.get('giveaways'); }
  async saveGiveaway(messageId, giveawayData) { db.push('giveaways', giveawayData); return true; }
  async editGiveaway(messageId, giveawayData) {
    const giveaways = db.get('giveaways') || [];
    const updated = giveaways.filter((g) => g.messageId !== messageId);
    updated.push(giveawayData);
    db.set('giveaways', updated);
    return true;
  }
  async deleteGiveaway(messageId) {
    const updated = (db.get('giveaways') || []).filter((g) => g.messageId !== messageId);
    db.set('giveaways', updated);
    return true;
  }
}

if (!db.get('giveaways')) db.set('giveaways', []);
const manager = new GiveawayManagerWithOwnDatabase(client, {
  default: {
    botsCanWin: false,
    embedColor: '#FF0000',
    reaction: '🎉'
  }
});
client.giveawaysManager = manager;

/* ===========================
   SYSTÈME DE NIVEAUX
   =========================== */
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  let messageFetch = db.fetch(`guildMessages_${message.guild.id}`);
  if (messageFetch === null) return;

  db.add(`messages_${message.guild.id}_${message.author.id}`, 1);
  let msgCount = db.fetch(`messages_${message.guild.id}_${message.author.id}`);

  if (msgCount % 100 === 0) {
    db.add(`level_${message.guild.id}_${message.author.id}`, 1);
    let level = db.fetch(`level_${message.guild.id}_${message.author.id}`);

    let levelembed = new EmbedBuilder()
      .setColor('#2f3136')
      .setDescription(`**${message.author}, vous avez atteint le niveau ${level} !**`)
      .setFooter({ text: `${prefix}offxp pour désactiver` });

    message.channel.send({ embeds: [levelembed] });
  }
});

process.on('unhandledRejection', err => {
  if (client.logger) client.logger.error(err);
  else console.error('Unhandled Rejection:', err);
});
