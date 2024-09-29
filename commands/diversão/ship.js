const {
    SlashCommandBuilder,
    AttachmentBuilder

} = require('discord.js')
const Canvas = require('canvas')

const { resolve } = require('path')
const client = require("../../index")
const comandos = require("../../database/models/comandos")

const { registerFont } = require('canvas')
registerFont("././fonts/aAkhirTahun.ttf", { family: "aAkhirTahun" })


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Calcula a porcentagem de compatibilidade de dois usuários.')
        .addUserOption(option =>
            option
                .setName("usuários-1")
                .setDescription("Mencione o usuário 1")
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName("usuários-2")
                .setDescription("Mencione o usuário 2.")
                .setRequired(true)
        ),

    async execute(interaction) {


        const cmd = await comandos.findOne({
            guildId: interaction.guild.id
        })

        if (!cmd) return interaction.reply({
            content: `> \`-\` <a:alerta:1163274838111162499> Um Adminitrador ainda não configurou o canal para uso de comandos!`,
            ephemeral: true
        })


        let cmd1 = cmd.canal1

        if (cmd1 === null || cmd1 === true || !client.channels.cache.get(cmd1) || cmd1 === interaction.channel.id) {


            //Canvas 
            Canvas.registerFont(resolve("./fonts/Pelita.otf"), { family: "Pelita" });
            const canvas = Canvas.createCanvas(500, 195);
            const ctx = canvas.getContext('2d');

            const user1 = interaction.options.getUser('usuários-1');
            const user2 = interaction.options.getUser('usuários-2');





            //Imagem De Fundo
            let ImageLoad = 'https://raw.githubusercontent.com/arrastaorj/flags/main/shipalt.png'

            const user1Avatar = user1.displayAvatarURL({ extension: 'png', size: 128 });
            const user2Avatar = user2.displayAvatarURL({ extension: 'png', size: 128 });

            //Função da geração do número aleatório 0 a 105%
            const shipPercentage = percentage();

            //Manipular Imagem
            const backgroundImage = await Canvas.loadImage(ImageLoad);
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);


            //Avatar dos Usuários Mencionados Centralizados
            const user1Image = await Canvas.loadImage(user1Avatar);
            const user2Image = await Canvas.loadImage(user2Avatar);
            //Função dos Usuários 
            function drawRoundedImage(ctx, image, x, y, size) {
                const radius = size / 2;
                const borderWidth = 1; // Largura da borda

                // Salve o estado atual do contexto
                ctx.save();

                // Crie um caminho circular para a moldura branca
                ctx.beginPath();
                ctx.arc(x + radius, y + radius, radius + borderWidth, 0, Math.PI * 2);
                ctx.closePath();

                // Defina a cor da borda para branco
                ctx.strokeStyle = "white";
                ctx.lineWidth = borderWidth;

                // Desenhe a borda
                ctx.stroke();

                // Crie um novo caminho circular para a imagem
                ctx.beginPath();
                ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
                ctx.closePath();

                // Recorte a imagem para que ela se ajuste ao círculo
                ctx.clip();

                // Desenhe a imagem dentro do círculo
                ctx.drawImage(image, x, y, size, size);

                // Restaure o estado anterior do contexto
                ctx.restore();
            }

            // Suponha que você tenha um contexto (ctx), duas imagens (user1Image e user2Image) e coordenadas (x, y) para cada imagem.
            drawRoundedImage(ctx, user1Image, 50, 40, 100);
            drawRoundedImage(ctx, user2Image, 330, 40, 100);




            let bar_width = 400;
            ctx.lineJoin = "round";
            ctx.lineWidth = 25;

            let whiteStrokeWidth = 1;
            let yOffset = 10;

            ctx.strokeStyle = "#12111f";
            ctx.lineWidth = 25 + whiteStrokeWidth;
            ctx.strokeRect(30 - whiteStrokeWidth / 2, 181 - whiteStrokeWidth / 2 - yOffset, bar_width + whiteStrokeWidth, 0);

            let gradient = ctx.createLinearGradient(30, 0, 30 + bar_width, 0);
            gradient.addColorStop(0, "#ff0080");
            gradient.addColorStop(1, "#ff4500");

            ctx.strokeStyle = gradient;

            // Ajuste a escala da porcentagem para a largura total da barra
            let scaledPercentage = (shipPercentage / 100) * bar_width;

            ctx.lineWidth = 25;
            ctx.strokeRect(30, 180 - yOffset, scaledPercentage, 0);


            ctx.font = `20px aAkhirTahun`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(`${shipPercentage}%`, 250, 178, 60, 30);



            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ship.png' });

            //Função para combinar os nomes
            const combinedUsername = combineUsernames(user1, user2);

            //Mensagem aleatória dependendo do resultado do ship
            let message = '';
            if (shipPercentage >= 40 && shipPercentage <= 45) {
                message = `A química entre eles é notável, como duas almas gêmeas prestes a se encontrar! 🔥❤️`;
            } else if (shipPercentage > 45 && shipPercentage <= 50) {
                message = `A relação deles parece estar no caminho certo, como um romance em crescimento! 🌱❤️`;
            } else if (shipPercentage >= 1 && shipPercentage <= 5) {
                message = `Embora as chances sejam baixas, lembre-se de que o amor pode surgir de surpresas inesperadas. Não perca a esperança! 🌦️❤️`;
            } else if (shipPercentage > 5 && shipPercentage <= 10) {
                message = `O amor pode ser imprevisível, mantenha a chama acesa e veja o que o destino reserva! 🌟❤️`;
            } else if (shipPercentage >= 11 && shipPercentage <= 15) {
                message = `Existe um pequeno raio de esperança, uma semente de amor que aguarda o momento certo para florescer! 🌈❤️`;
            } else if (shipPercentage > 15 && shipPercentage <= 20) {
                message = `O amor está à espreita, pronto para envolver esses corações com ternura e paixão! ❤️🌟`;
            } else if (shipPercentage >= 21 && shipPercentage <= 30) {
                message = `Acredito que esses dois têm o potencial para uma bela história de amor, como uma dança harmoniosa do destino! 💃❤️`;
            } else if (shipPercentage > 30 && shipPercentage <= 39) {
                message = `O amor está no ar, e esses dois podem ser o próximo grande sucesso romântico! 💞❤️`;
            } else if (shipPercentage >= 51 && shipPercentage <= 55) {
                message = `Agora, o destino está nas mãos de ${user2}, estou ansioso para ver o que o futuro reserva para vocês! 🙌❤️`;
            } else if (shipPercentage > 55 && shipPercentage <= 60) {
                message = `Este casal está em ascensão! Que aventuras românticas aguardam vocês dois no horizonte! 🚀❤️`;
            } else if (shipPercentage >= 61 && shipPercentage <= 70) {
                message = `Um casal incrível! Mal posso esperar para celebrar o seu amor em grande estilo! 🎉❤️`;
            } else if (shipPercentage > 70 && shipPercentage <= 80) {
                message = `Amor verdadeiro floresce! Quando será a data do grande dia? Estou pronto para comemorar com vocês! 🎊❤️`;
            } else if (shipPercentage >= 81 && shipPercentage <= 85) {
                message = `O amor está no comando! ${user1} & ${user2}, sua jornada amorosa promete ser espetacular! 💖❤️`;
            } else if (shipPercentage > 85 && shipPercentage <= 90) {
                message = `Uma história de amor incrível! Mal posso esperar para testemunhar o próximo capítulo de vocês! 📖❤️`;
            } else if (shipPercentage >= 91 && shipPercentage <= 95) {
                message = `O amor venceu todos os obstáculos! ${user1} & ${user2}, vocês são uma inspiração para todos nós! 🌟`;
            } else if (shipPercentage > 95 && shipPercentage <= 100) {
                message = `Uma história de amor épica, digna de conto de fadas! O casamento de ${user1} & ${user2} é um evento que marcará época! 👰🤵❤️`;
            }

            await interaction.reply({
                files: [attachment],
                content: `💏 Casal: ${user1} & ${user2}\n📝 Nome do Ship: **${combinedUsername}**\n\n**${message}**`
            })

        }
        else if (interaction.channel.id !== cmd1) {
            interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${cmd1}>.`,
                ephemeral: true
            })
        }


    }
}

//Funções Abaixo

function percentage() {
    const hearts = Math.floor(Math.random() * 105) + 0;
    return hearts
};

function combineUsernames(user1, user2) {
    const user1Name = user1.displayName;
    const user2Name = user2.displayName;

    const combinedName = `${user1Name.slice(0, Math.floor(user1Name.length / 2))}${user2Name.slice(Math.floor(user2Name.length / 2))}`;

    return combinedName
};

function drawRoundedImage(ctx, image, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
}