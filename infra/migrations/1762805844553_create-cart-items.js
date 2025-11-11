exports.up = (pgm) => {
    pgm.createTable("cart_items", {
        cart_id: {
            type: "uuid",
            notNull: true,
            references: "carts",
            onDelete: "CASCADE",
        },
        listing_id: {
            type: "uuid",
            notNull: true,
            references: "listings",
        },
        quantity: {
            type: "integer",
            notNull: true,
            check: "quantity > 0",
        },
        price_locked: {
            type: "numeric(12, 2)",
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable("cart_items");
};