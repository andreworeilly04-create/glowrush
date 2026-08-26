import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

  if (body.items) {
    const lineItems = body.items.map((item: any) => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                description:item.description || '',
            },
            unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
    }));

    if (body.shipping && body.shipping > 0){
          lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Shipping',
                }, 
                unit_amount: Math.round(body.shipping * 100),
            },
            quantity:1,
        });
    }

    if (body.tax && body.tax > 0){
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Estimated Tax',
                }, 
                unit_amount: Math.round(body.tax * 100),
            },
            quantity:1,
        });
    }
  
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/orders?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
}

return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('SERVER CHECKOUT ERROR:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
