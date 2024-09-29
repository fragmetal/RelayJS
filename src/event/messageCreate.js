const { Collection, PermissionFlagsBits } = require("discord.js");

const cooldowns = new Collection();

module.exports = async (client, message) => {
    if (message.author.bot) return;

    // Ensure the member data is available
    if (!message.member) {
        // Attempt to fetch the member if not available
        message.member = await message.guild.members.fetch(message.author.id).catch(err => console.log("Failed to fetch member:", err));
    }

    // If member data is still not available, return
    if (!message.member) return;

    // COOLDOWNS & ERROR HANDLING
    if (!cooldowns.has(props.name)) { cooldowns.set(props.name, new Collection()); }
    const now = Date.now();
    const timestamps = cooldowns.get(props.name);
    const cooldownAmount = (props.cooldown || 2) * 1000;
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`Wait ${timeLeft.toFixed(1)} more second${timeLeft.toFixed(1)<2 ? '' : 's'} to use **${props.name}**`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // PERMISSION CHECKER
    if (props.permissions) {
        // Check if permissions property exists and if member has the required permission
        if (!message.member.permissions || !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply(`You're missing permissions: **Manage Messages**`);
        }
    }
};
