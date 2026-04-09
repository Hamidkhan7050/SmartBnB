export const negotiatePrice = async (req, res) => {
    try {
        const { realPrice, userOffer, attempt } = req.body;

        const price = Number(realPrice);
        const offer = Number(userOffer);

        if (!price || isNaN(price)) {
            return res.json({ success: false, message: "Invalid real price" });
        }

        if (isNaN(offer) || offer <= 0) {
            return res.json({
                success: false,
                status: "invalid",
                message: "Invalid offer"
            });
        }

        const minAllowedPrice = Math.floor(price * 0.85);

        if (attempt > 3) {
            return res.json({
                success: false,
                status: "closed",
                message: "❌ Negotiation closed"
            });
        }

        if (offer > price) {
            return res.json({
                success: true,
                status: "counter",
                counterPrice: price,
                message: `⚠ You entered ₹${offer}, higher than ₹${price}`
            });
        }

        let counter;

        //  attempt 1 & 2
        if (attempt === 1 || attempt === 2) {

            if (offer < minAllowedPrice) {
                counter = Math.floor(price * 0.92);
            } else {
                counter = Math.floor(
                    Math.max(
                        minAllowedPrice,
                        price - (price - offer) / 2
                    )
                );
            }

            return res.json({
                success: true,
                status: "counter",
                counterPrice: counter,
                message: `🤔 I can offer you ₹${counter}`
            });
        }

        //  FINAL
        if (attempt === 3) {

            if (offer < minAllowedPrice) {
                const finalPrice = Math.floor(price * 0.98);

                return res.json({
                    success: true,
                    status: "accept",
                    finalPrice,
                    message: `😐 Too low. Final ₹${finalPrice} (2% discount)`
                });
            }

            const finalPrice = Math.max(minAllowedPrice, offer);

            return res.json({
                success: true,
                status: "accept",
                finalPrice,
                message: `🤝 Final deal at ₹${finalPrice}`
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};