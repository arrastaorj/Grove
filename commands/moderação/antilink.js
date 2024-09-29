
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    PermissionsBitField,
} = require('discord.js')

const client = require("../../index.js")
const GuildConfig = require('../../database/models/antilink.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antilink')
        .setDescription('Ajuste as configurações do Antilink para maior eficácia em seu servidor.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Ativar ou desativar o Antilink em seu servidor.')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Ativar ou desativar o Antilink.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Ativar', value: 'ativar' },
                            { name: 'Desativar', value: 'desativar' },
                        )),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addrole')
                .setDescription('Adicionar um cargo que pode enviar links.')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('O cargo a ser adicionado.')
                        .setRequired(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remrole')
                .setDescription('Remover um cargo com permissão para enviar links.')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('O cargo a ser removido.')
                        .setRequired(true),
                ),
        ),

    async execute(interaction) {

        // Verificação de permissões
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir este comando pois você não possui permissão.`,
                ephemeral: true
            });
        }

        const botMember = interaction.guild.members.cache.get(client.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: `> \`-\` <a:alerta:1163274838111162499> Não posso concluir o comandos pois ainda não recebir permissão para gerenciar este servidor (Administrador)`,
                ephemeral: true
            });
        }

        const guildId = interaction.guild.id;

        let guildConfig = await GuildConfig.findOne({
            guildId,
        });

        if (!guildConfig) {
            guildConfig = await GuildConfig.create({
                guildId,
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'status') {
            const action = interaction.options.getString('action')

            if (action === 'ativar') {

                if (guildConfig.antilinkEnabled) {
                    await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> O antilink já está ativado em seu servidor.`,
                        ephemeral: true
                    });
                } else {
                    guildConfig.antilinkEnabled = true;
                    await guildConfig.save();
                    await interaction.reply({
                        content: `> \`+\` O Antilink foi ativado em seu servidor. Agora, estou fortalecendo a proteção contra links indesejados para garantir a segurança do seu servidor.`,
                        ephemeral: true
                    });

                }
            } else if (action === 'desativar') {
                if (!guildConfig.antilinkEnabled) {
                    await interaction.reply({
                        content: `> \`-\` <a:alerta:1163274838111162499> O antilink já está desativado em seu servidor.`,
                        ephemeral: true
                    });
                } else {
                    guildConfig.antilinkEnabled = false;
                    await guildConfig.save();

                    if (!guildConfig.antilinkEnabled) {
                        await GuildConfig.findOneAndDelete({
                            guildId,
                        });
                    }

                    await interaction.reply({
                        content: `> \`+\` O antilink foi desativado em seu servidor.`,
                        ephemeral: true
                    });

                }
            }
        } else if (subcommand === 'addrole') {
            const role = interaction.options.getRole('role');
            const roleId = role.id;

            if (!guildConfig.allowedRoles.includes(roleId)) {
                guildConfig.allowedRoles.push(roleId);
                await guildConfig.save();

                await interaction.reply({
                    content: `> \`+\` O cargo ${role.name} foi adicionado à lista de cargos permitidos para enviar links.`,
                    ephemeral: true
                });


            } else {
                await interaction.reply({
                    content: `> \`-\` <a:alerta:1163274838111162499> O cargo ${role.name} já foi incluído na lista de cargos autorizados para enviar links.`,
                    ephemeral: true
                });
            }
        } else if (subcommand === 'remrole') {
            const role = interaction.options.getRole('role');
            const roleId = role.id;
            const roleIndex = guildConfig.allowedRoles.indexOf(roleId);

            if (roleIndex !== -1) {
                guildConfig.allowedRoles.splice(roleIndex, 1);
                await guildConfig.save();

                await interaction.reply({
                    content: `> \`+\` O cargo ${role.name} foi removido da lista de cargos permitidos para enviar links.`,
                    ephemeral: true
                });

            } else {
                await interaction.reply({
                    content: `> \`-\` <a:alerta:1163274838111162499> O cargo ${role.name} não estava na lista de cargos permitidos para enviar links.`,
                    ephemeral: true
                })
            }
        }

    }
}
