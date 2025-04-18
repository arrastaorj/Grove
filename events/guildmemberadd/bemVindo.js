const { AttachmentBuilder } = require("discord.js");
const client = require('../../index');
const bemvindoModel = require("../../database/models/bemvindo");
const Canvas = require("canvas");

// Registre a fonte uma vez, fora do evento
const { registerFont } = require('canvas');
registerFont('./fonts/Nexa-Heavy.ttf', { family: 'Nexa-Heavy' });

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Consulta para obter as configurações de boas-vindas
            const boasVindasConfig = await bemvindoModel.findOne({ guildId: member.guild.id });

            // Verifica se o sistema de boas-vindas está ativo e se há um canal configurado
            const isBoasVindasAtivo = boasVindasConfig && boasVindasConfig.isActive;
            const canalBoasVindas = boasVindasConfig?.canal1;
            const welcomeImage = boasVindasConfig?.welcomeImage || "https://raw.githubusercontent.com/arrastaorj/flags/main/bemvindo.jpg";

            if (!isBoasVindasAtivo || !canalBoasVindas) return;

            // Criação do canvas para a imagem de boas-vindas
            const canvas = Canvas.createCanvas(1024, 500);
            const context = canvas.getContext('2d');

            context.fillStyle = '#F8F8FF';
            const img = await Canvas.loadImage(welcomeImage);
            context.drawImage(img, 0, 0, 1024, 500);

            context.font = '65px "Nexa-Heavy"';
            context.fillText(`Bem-Vindo(a)`, 300, 360);
            context.textAlign = 'center';

            // Criar um círculo para o avatar
            context.beginPath();
            context.arc(512, 166, 128, 0, Math.PI * 2, true);
            context.closePath();

            context.font = '42px "Nexa-Heavy"';
            context.fillText(`${member.user.tag.toUpperCase()}`, 512, 410);
            context.font = '20px "Nexa-Heavy"';
            context.fillText(`Você é nosso membro de n° ${member.guild.memberCount}`, 512, 455);
            context.textAlign = 'center';

            // Cortar o círculo para o avatar
            context.beginPath();
            context.arc(512, 166, 119, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();

            // Carregar o avatar do membro
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 1024 }));
            context.drawImage(avatar, 393, 47, 238, 238);

            const mensagem = new AttachmentBuilder(canvas.toBuffer(), { name: `${member.user.tag}.png` });

            // Enviar a mensagem ao canal de boas-vindas
            const channel = client.channels.cache.get(canalBoasVindas);
            if (channel) {
                await channel.send({ content: `Olá ${member}`, files: [mensagem] });
            }
        } catch (error) {
            console.error("Erro ao processar o evento guildMemberAdd:", error)
        }
    }
}
