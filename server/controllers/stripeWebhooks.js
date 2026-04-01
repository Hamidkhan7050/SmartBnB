
import Stripe from "stripe";
import Booking from "../models/Booking.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(" Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const bookingId = session.metadata.bookingId;

      console.log(" Payment success for booking:", bookingId);

      if (!bookingId) {
        console.log(" No bookingId found in metadata");
        return res.status(400).send("No bookingId in metadata");
      }

      await Booking.findByIdAndUpdate(bookingId, {
        isPaid: true,
        status: "confirmed",
        paymentMethod: "Stripe",
      });

      console.log(" Booking updated successfully");
    }

    res.json({ received: true }); //  IMPORTANT

  } catch (error) {
    console.log(" Error processing webhook:", error.message);
    res.status(500).send("Server Error");
  }
};