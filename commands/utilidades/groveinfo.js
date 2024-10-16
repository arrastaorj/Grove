const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js')
const { readdirSync } = require("fs")
require("moment-duration-format")

const client = require("../../index")
const comandos = require("../../database/models/comandos")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grove')
        .setDescription('Veja as informações sobre minha vida.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Veja as informações sobre minha vida.')
        ),

    async execute(interaction) {

        // Verifica se o canal correto foi configurado
        const canalID = await comandos.findOne({ guildId: interaction.guild.id });
        if (!canalID || !canalID.canal1) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Um administrador ainda não configurou o canal para a utilização dos comandos.`,
                ephemeral: true
            });
        }

        const canalPermitido = canalID.canal1;
        if (interaction.channel.id !== canalPermitido) {
            return interaction.reply({
                content: `> \`-\` <:NA_Intr004:1289442144255213618> Você está tentando usar um comando no canal de texto errado, tente usá-lo no canal correto. <#${canalPermitido}>.`,
                ephemeral: true
            });
        }


        function formatTime(milliseconds) {
            const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
            const hours = Math.floor(milliseconds / (1000 * 60 * 60) % 24);
            const minutes = Math.floor(milliseconds / (1000 * 60) % 60);
            const seconds = Math.floor(milliseconds / 1000 % 60);

            return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
        }

        var commands = []
        readdirSync("././commands/").forEach((dir) => {
            var dircmds = readdirSync(`././commands/${dir}/`).filter((file) =>
                file.endsWith(".js")
            );

            commands = commands.concat(dircmds)
        })

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Olá, eu sou a Grove. Prazer em conhecê-lo! ✨`, iconURL: client.user.displayAvatarURL() })
            .setColor("#ba68c8")
            .setTitle("Informações sobre mim")
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`Atualmente, faço parte de **${client.guilds.cache.size}** servidores e ofereço **${commands.length}** comandos para facilitar sua experiência.
            
            Fui criada em <t:${Math.round(client.user.createdTimestamp / 1000)}> com a missão de unificar gerenciamento, administração e utilidades em um só lugar.
                    
            Atualmente, estou gerenciando **${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}** membros.`)

            .addFields(
                {
                    name: `Tempo Online`,
                    value: `${formatTime(client.uptime)}`,
                    inline: true,
                },
                {
                    name: `Ping`,
                    value: `${Math.round(client.ws.ping)}ms`,
                    inline: true,
                },
            )

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Convite")
                .setURL("https://dsc.gg/grovebot")
                .setStyle(ButtonStyle.Link),

            new ButtonBuilder()
                .setCustomId("privacy_policy")
                .setLabel("Política de Privacidade")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setLabel("Top.gg")
                .setURL("https://top.gg/bot/1053482665942196224/vote")
                .setStyle(ButtonStyle.Link),

            new ButtonBuilder()
                .setLabel("Suporte")
                .setURL("https://discord.gg/4CB7AjQDAS")
                .setStyle(ButtonStyle.Link)
        );

        await interaction.reply({
            embeds: [embed],
            components: [actionRow]
        });

        const filter = i => i.customId === 'privacy_policy' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'privacy_policy') {
                const privacyEmbed = new EmbedBuilder()
                    .setColor("#ba68c8")
                    .setTitle("Política de Privacidade")
                    .setDescription(`
                       POLÍTICA DE PRIVACIDADE USO DO BOT

Última atualização: [1/10/2024]

Esta Política de Privacidade descreve como o arrastaorj gerencia as informações coletadas dos usuários ("Usuários", "Você") ao utilizar o Bot do Discord Grove#4420. Ao utilizar o Bot, você concorda com esta Política de Privacidade. Se você não concordar com esta Política, por favor, não utilize o Bot.

1. Coleta de Informações
1.1 Informações Necessárias: O Bot pode acessar o nome de usuário e o ID de usuário do Discord para fornecer suas funcionalidades. O Bot não coleta informações pessoais adicionais ou histórico de mensagens.

1.2 Interações no Bot: O Bot armazena interações apenas enquanto elas são processadas, sem retenção de informações de comandos após o término de cada sessão.

2. Uso das Informações
2.1 Fornecimento de Serviços: As informações acessadas são utilizadas exclusivamente para operar e manter o Bot, respondendo a comandos e interações enquanto o Bot está ativo no servidor.

2.2 Suporte e Comunicação: Poderemos entrar em contato com você por meio do Discord para responder a questões ou fornecer suporte relacionado ao Bot.

2.3 Análise e Melhoria: Utilizamos dados gerais e anonimizados sobre o uso do Bot para melhorar suas funcionalidades. Nenhuma informação pessoal identificável é utilizada para esse fim.

3. Armazenamento e Retenção
3.1 Armazenamento Temporário: O Bot não armazena permanentemente nenhuma informação pessoal. Interações e comandos são processados em tempo real e não são mantidos em nossos sistemas após o processamento.

4. Compartilhamento de Informações
4.1 Terceiros: Não compartilhamos suas informações com terceiros, exceto se exigido por lei.

5. Segurança
5.1 Proteção das Informações: Empregamos medidas de segurança para proteger contra acesso não autorizado enquanto processamos comandos. Não mantemos registros após o término de cada sessão.

6. Consentimento
6.1 Concordância: Ao utilizar o Bot, você concorda com o acesso temporário das informações necessárias para o funcionamento do Bot, conforme descrito nesta Política de Privacidade.

7. Menores de Idade
7.1 Restrições de Idade: O Bot não é destinado a menores de 13 anos e não é projetado para coletar informações de menores. Se você acredita que inadvertidamente coletamos informações de um menor, entre em contato para que possamos removê-las imediatamente.

8. Alterações na Política de Privacidade
8.1 Modificações: Podemos atualizar esta Política de Privacidade periodicamente. As alterações serão publicadas nesta página, e o uso contínuo do Bot após as modificações constitui aceitação das políticas revisadas.

9. Contato
Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato conosco pelo e-mail neutro06031970@gmail.com.
                    `);

                await i.reply({ embeds: [privacyEmbed], ephemeral: true });
            }
        });
    }
}
