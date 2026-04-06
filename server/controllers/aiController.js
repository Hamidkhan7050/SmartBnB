export const negotiatePrice = async (req, res) => {
    try {
        const { realPrice, userOffer, attempt } = req.body;

        const price = Number(realPrice);   // ✅ FIX
        const offer = Number(userOffer);

        // ❗ validation
        if (!price || isNaN(price)) {
            return res.json({
                success: false,
                message: "Invalid real price"
            });
        }

        if (isNaN(offer) || offer <= 0) {
            return res.json({
                success: false,
                status: "invalid",
                message: "⚠️ Invalid price"
            });
        }

        const minAllowedPrice = Math.floor(price * 0.85);
        const maxDiscount = price - minAllowedPrice;

        if (attempt > 3) {
            return res.json({
                success: false,
                status: "closed",
                message: "❌ Negotiation closed. No more attempts left."
            });
        }

        if (offer > price) {
            return res.json({
                success: false,
                status: "invalid",
                message: `⚠️ You entered ₹${offer}, higher than actual price ₹${price}.`
            });
        }

        if (offer < minAllowedPrice) {
            return res.json({
                success: false,
                status: "reject",
                message: `😅 That's too low! Try a better offer.`
            });
        }

        if (attempt === 3 && offer >= minAllowedPrice) {
            return res.json({
                success: true,
                status: "accept",
                finalPrice: offer,
                message: `🤝 Final deal accepted at ₹${offer}.`
            });
        }

        let counter = minAllowedPrice;

        if (attempt === 1) {
            counter = price - Math.floor(maxDiscount * 0.4);
            counter += Math.floor(Math.random() * 50);
        } else if (attempt === 2) {
            counter = price - Math.floor(maxDiscount * 0.7);
            counter += Math.floor(Math.random() * 30);
        }

        counter = Math.min(counter, price);

        if (offer >= counter) {
            return res.json({
                success: true,
                status: "accept",
                finalPrice: offer,
                message: `👍 Good offer! Deal accepted at ₹${offer}.`
            });
        }

        return res.json({
            success: true,
            status: "counter",
            counterPrice: counter,
            message: `🤔 I understand your offer of ₹${offer}, but I can offer you ₹${counter}.`
        });

    } catch (error) {
        console.log(error); // ⭐ ADD THIS
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};