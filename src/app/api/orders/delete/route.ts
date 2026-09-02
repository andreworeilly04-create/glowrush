import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const orderRef = doc(db, 'orders', id);
    const orderSnapshot = await getDoc(orderRef);

    if (!orderSnapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = orderSnapshot.data();

    const paymentIntentId = orderData.stripePaymentIntentId;

    if (paymentIntentId) {
      console.log("Refunding Stripe PaymentIntent:", paymentIntentId);

      await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      console.log("Stripe refund successful");
    } else {
      console.warn(
        "No stripePaymentIntentId found for order:",
        id
      );
    }

    await deleteDoc(orderRef);

    return NextResponse.json({
      success: true,
      message: "Order cancelled and payment refunded successfully",
    });
  } catch (error: any) {
    console.error('Delete/refund order error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}