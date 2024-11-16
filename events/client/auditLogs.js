
const client = require('../../index')
const GuildConfig = require('../../database/models/auditlogs');
const { EmbedBuilder } = require('discord.js');


async function sendLog(guildId, embed) {
    const guildConfig = await GuildConfig.findOne({ guildId });
    if (!guildConfig?.isActive || !guildConfig.canalLogs) return;

    const logChannel = client.channels.cache.get(guildConfig.canalLogs);
    if (logChannel) {
        await logChannel.send({ embeds: [embed] });
    }
}


client.on("messageDelete", async (message) => {

    try {
        if (message.partial) await message.fetch();
    } catch (error) {

        return
    }

    const embed = new EmbedBuilder()
        .setTitle("🗑️ Mensagem Excluída")
        .setColor("#FF4500")
        .setDescription(`Uma mensagem foi excluída no canal ${message.channel}.\n**Autor:** ${message.author.tag}`)
        .addFields({ name: "Conteúdo", value: message.content || "Nenhum conteúdo detectado." })
        .setTimestamp();

    await sendLog(message.guild.id, embed);
})

client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) await Promise.all([oldMessage.fetch(), newMessage.fetch()]);

    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
        .setTitle("✏️ Mensagem Editada")
        .setColor("#03f7ff")
        .setDescription(`Uma mensagem foi editada no canal ${oldMessage.channel}.\n**Autor:** ${oldMessage.author.tag}`)
        .addFields(
            { name: "Antes", value: oldMessage.content || "Nenhum conteúdo detectado." },
            { name: "Depois", value: newMessage.content || "Nenhum conteúdo detectado." }
        )
        .setTimestamp();

    await sendLog(oldMessage.guild.id, embed);
})

client.on("guildBanAdd", async (ban) => {
    const embed = new EmbedBuilder()
        .setTitle("🔨 Membro Banido")
        .setColor("#FF0000")
        .setThumbnail(ban.user.displayAvatarURL({ extension: 'png' }))
        .setDescription(`O membro **${ban.user.tag}** (\`${ban.user.id}\`) foi banido do servidor.`)
        .setTimestamp();

    await sendLog(ban.guild.id, embed);
})

client.on("guildBanRemove", async (ban) => {
    const embed = new EmbedBuilder()
        .setTitle("🛡️ Banimento Revogado")
        .setColor("#00FF00")
        .setThumbnail(ban.user.displayAvatarURL({ extension: 'png' }))
        .setDescription(`O banimento do membro **${ban.user.tag}** (\`${ban.user.id}\`) foi revogado.`)
        .setTimestamp();

    await sendLog(ban.guild.id, embed);
})

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const changes = [];

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0) {
        changes.push({
            name: "📥 Cargos Adicionados",
            value: addedRoles.map(role => role.name).join(", "),
            inline: true
        });
    }

    if (removedRoles.size > 0) {
        changes.push({
            name: "📤 Cargos Removidos",
            value: removedRoles.map(role => role.name).join(", "),
            inline: true
        });
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle("🛠️ Alterações nos Cargos do Membro")
            .setColor("#03f7ff")
            .setThumbnail(newMember.user.displayAvatarURL({ extension: 'png' }))
            .setDescription(`Alterações detectadas no membro **${newMember.user.tag}** (\`${newMember.id}\`):`)
            .addFields(changes)
            .setTimestamp();

        await sendLog(newMember.guild.id, embed);
    }
})

client.on("guildUpdate", async (oldGuild, newGuild) => {
    const changes = [];

    if (oldGuild.name !== newGuild.name) {
        changes.push({
            name: "📝 Nome Alterado",
            value: `**Antes:** ${oldGuild.name}\n**Depois:** ${newGuild.name}`,
            inline: true
        });
    }

    if (oldGuild.icon !== newGuild.icon) {
        changes.push({
            name: "🖼️ Ícone Alterado",
            value: "O ícone do servidor foi atualizado.",
            inline: false
        });
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle("🔧 Alterações no Servidor")
            .setColor("#FFA500")
            .setThumbnail(newGuild.iconURL({ extension: 'png' }))
            .setTimestamp()
            .setDescription(`Alterações detectadas no servidor ${newGuild.name}.`)
            .addFields(changes);

        await sendLog(newGuild.id, embed);
    }
    if (oldGuild.bannerURL() !== newGuild.bannerURL()) {
        const embed = new EmbedBuilder()
            .setTitle("🌆 Banner do Servidor Alterado")
            .setColor("#03A9F4")
            .setDescription(`O banner do servidor foi atualizado.`)
            .setImage(newGuild.bannerURL({ dynamic: true, size: 512 }))
            .setTimestamp();

        await sendLog(newGuild.id, embed);
    }
    if (oldGuild.premiumTier !== newGuild.premiumTier) {
        const embed = new EmbedBuilder()
            .setTitle("🚀 Nível de Boost Atualizado")
            .setColor("#FF69B4")
            .setDescription(`O nível de boost do servidor foi alterado:\n**Antes:** ${oldGuild.premiumTier}\n**Depois:** ${newGuild.premiumTier}`)
            .setTimestamp();

        await sendLog(newGuild.id, embed);
    }
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
        const embed = new EmbedBuilder()
            .setTitle("🔒 Nível de Verificação Alterado")
            .setColor("#FFA500")
            .setDescription(`O nível de verificação do servidor foi alterado:\n**Antes:** ${oldGuild.verificationLevel}\n**Depois:** ${newGuild.verificationLevel}`)
            .setTimestamp();

        await sendLog(newGuild.id, embed);
    }
})

client.on("emojiUpdate", async (oldEmoji, newEmoji) => {
    const changes = [];

    if (oldEmoji.name !== newEmoji.name) {
        changes.push({
            name: "📝 Nome Alterado",
            value: `**Antes:** ${oldEmoji.name}\n**Depois:** ${newEmoji.name}`,
            inline: true
        });
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle("😀 Emoji Atualizado")
            .setColor("#FFFF00")
            .setThumbnail(newEmoji.url)
            .setDescription(`O emoji **${oldEmoji.name}** (\`${oldEmoji.id}\`) foi atualizado.`)
            .addFields(changes)
            .setTimestamp();

        await sendLog(newEmoji.guild.id, embed);
    }
})

client.on("emojiCreate", async (emoji) => {
    const embed = new EmbedBuilder()
        .setTitle("🎉 Novo Emoji Criado")
        .setColor("#00FF00")
        .setThumbnail(emoji.url)
        .setDescription(`Um novo emoji foi criado:\n**Nome:** ${emoji.name}\n**ID:** ${emoji.id}`)
        .setTimestamp();

    await sendLog(emoji.guild.id, embed);
})

client.on("emojiDelete", async (emoji) => {
    const embed = new EmbedBuilder()
        .setTitle("❌ Emoji Removido")
        .setColor("#FF0000")
        .setThumbnail(emoji.url)
        .setDescription(`O emoji **${emoji.name}** (\`${emoji.id}\`) foi removido do servidor.`)
        .setTimestamp();

    await sendLog(emoji.guild.id, embed);
})

client.on("channelUpdate", async (oldChannel, newChannel) => {
    const changes = [];

    if (oldChannel.name !== newChannel.name) {
        changes.push({
            name: "📝 Nome Alterado",
            value: `**Antes:** ${oldChannel.name}\n**Depois:** ${newChannel.name}`,
            inline: true
        });
    }

    if (oldChannel.topic !== newChannel.topic) {
        changes.push({
            name: "📜 Tópico Alterado",
            value: `**Antes:** ${oldChannel.topic || "Nenhum"}\n**Depois:** ${newChannel.topic || "Nenhum"}`,
            inline: true
        });
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle("📢 Alteração em Canal")
            .setColor("#03A9F4")
            .setDescription(`Alterações detectadas no canal **${oldChannel.name}**.`)
            .addFields(changes)
            .setTimestamp();

        await sendLog(newChannel.guild.id, embed);
    }
})

client.on("channelCreate", async (channel) => {
    const embed = new EmbedBuilder()
        .setTitle("📁 Novo Canal Criado")
        .setColor("#00FF00")
        .setDescription(`Um novo canal foi criado:\n**Nome:** ${channel.name}\n**ID:** ${channel.id}\n**Tipo:** ${channel.type}`)
        .setTimestamp();

    await sendLog(channel.guild.id, embed);
})

client.on("channelDelete", async (channel) => {
    const embed = new EmbedBuilder()
        .setTitle("🗑️ Canal Removido")
        .setColor("#FF0000")
        .setDescription(`O canal **${channel.name}** (\`${channel.id}\`) foi removido do servidor.`)
        .setTimestamp();

    await sendLog(channel.guild.id, embed);
})

client.on("webhookUpdate", async (channel) => {
    const embed = new EmbedBuilder()
        .setTitle("🔗 Webhook Atualizado")
        .setColor("#03A9F4")
        .setDescription(`Os webhooks do canal **${channel.name}** (\`${channel.id}\`) foram atualizados.`)
        .setTimestamp();

    await sendLog(channel.guild.id, embed);
})

client.on("roleUpdate", async (oldRole, newRole) => {
    const changes = [];

    if (oldRole.name !== newRole.name) {
        changes.push({
            name: "📝 Nome Alterado",
            value: `**Antes:** ${oldRole.name}\n**Depois:** ${newRole.name}`,
            inline: true
        });
    }

    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
        changes.push({
            name: "⚙️ Permissões Alteradas",
            value: "As permissões dessa função foram alteradas.",
            inline: false
        });
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ Função Atualizada")
            .setColor("#FFA500")
            .setDescription(`Alterações detectadas na função **${oldRole.name}** (\`${oldRole.id}\`).`)
            .addFields(changes)
            .setTimestamp();

        await sendLog(newRole.guild.id, embed);
    }
})

client.on("roleCreate", async (role) => {
    const embed = new EmbedBuilder()
        .setTitle("📜 Nova Função Criada")
        .setColor("#00FF00")
        .setDescription(`Uma nova função foi criada:\n**Nome:** ${role.name}\n**ID:** ${role.id}`)
        .setTimestamp();

    await sendLog(role.guild.id, embed);
})

client.on("roleDelete", async (role) => {
    const embed = new EmbedBuilder()
        .setTitle("🗑️ Função Removida")
        .setColor("#FF0000")
        .setDescription(`A função **${role.name}** (\`${role.id}\`) foi removida do servidor.`)
        .setTimestamp();

    await sendLog(role.guild.id, embed);
})

client.on("inviteCreate", async (invite) => {
    const embed = new EmbedBuilder()
        .setTitle("🔗 Novo Convite Criado")
        .setColor("#03A9F4")
        .setDescription(`Um novo convite foi criado:\n**Código:** ${invite.code}\n**Canal:** ${invite.channel.name}\n**Criado por:** ${invite.inviter.tag}`)
        .setTimestamp();

    await sendLog(invite.guild.id, embed);
})

client.on("inviteDelete", async (invite) => {
    const embed = new EmbedBuilder()
        .setTitle("❌ Convite Deletado")
        .setColor("#FF0000")
        .setDescription(`Um convite foi deletado:\n**Código:** ${invite.code}\n**Canal:** ${invite.channel?.name || "Desconhecido"}`)
        .setTimestamp();

    await sendLog(invite.guild.id, embed)
})

client.on("stickerCreate", async (sticker) => {
    const embed = new EmbedBuilder()
        .setTitle("📄 Novo Sticker Criado")
        .setColor("#00FF00")
        .setDescription(`Um novo sticker foi criado:\n**Nome:** ${sticker.name}\n**Descrição:** ${sticker.description || "Nenhuma"}`)
        .setThumbnail(sticker.url)
        .setTimestamp();

    await sendLog(sticker.guild.id, embed);
})

client.on("stickerUpdate", async (oldSticker, newSticker) => {
    const changes = [];

    if (oldSticker.name !== newSticker.name) {
        changes.push({
            name: "📝 Nome Alterado",
            value: `**Antes:** ${oldSticker.name}\n**Depois:** ${newSticker.name}`,
            inline: true
        });
    }

    if (oldSticker.description !== newSticker.description) {
        changes.push({
            name: "📜 Descrição Alterada",
            value: `**Antes:** ${oldSticker.description || "Nenhuma"}\n**Depois:** ${newSticker.description || "Nenhuma"}`,
            inline: false
        });
    }

    if (changes.length > 0) {
        const embed = new EmbedBuilder()
            .setTitle("📄 Sticker Atualizado")
            .setColor("#FFFF00")
            .setDescription(`O sticker **${oldSticker.name}** foi atualizado.`)
            .addFields(changes)
            .setThumbnail(newSticker.url)
            .setTimestamp();

        await sendLog(newSticker.guild.id, embed);
    }
})

client.on("stickerDelete", async (sticker) => {
    const embed = new EmbedBuilder()
        .setTitle("❌ Sticker Removido")
        .setColor("#FF0000")
        .setDescription(`O sticker **${sticker.name}** foi removido do servidor.`)
        .setThumbnail(sticker.url)
        .setTimestamp();

    await sendLog(sticker.guild.id, embed);
})
