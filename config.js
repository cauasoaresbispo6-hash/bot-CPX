require("dotenv").config();

module.exports = {
    TOKEN: process.env.BOT_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    GUILD_ID: process.env.GUILD_ID,
    TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID || null,

    STAFF_TICKET: [
        "1565917294008205435",
        "1565917294008205434",
        "1565917294008205433",
        "1565917294008205432",
        "1565917293983047769",
        "1565917293983047768",
        "1565917293907546206",
        "1565917294092091457"
    ],

    STAFF_XFACC: [
        "1565917294092091455",
        "1565917294092091456",
        "1565917294092091457"
    ]
};
