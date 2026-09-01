"use client";
import React, { useState } from "react";
import { useCart } from "@/context/context";
import styles from "./page.checkout.module.css";
import Image from "next/image";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [processing, setProcessing] = useState(false);

  // ---------------------------------------------------------
  // Handle form changes
  // ---------------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------------------------
  // Calculate order totals
  // ---------------------------------------------------------

  const subtotal = cart.reduce(
    (total: number, item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;

      return total + price * quantity;
    },
    0
  );

  const shipping = subtotal > 0 ? 5.0 : 0.0;

  const tax = subtotal * 0.07;

  const total = subtotal + shipping + tax;

  // ---------------------------------------------------------
  // Get logged-in Firebase user ID
  // ---------------------------------------------------------

  const getUserId = (): string | null => {
    try {
      const rawUser = localStorage.getItem("user");

      console.log(
        "Checkout - localStorage user:",
        rawUser
      );

      if (
        !rawUser ||
        rawUser === "undefined" ||
        rawUser === "null"
      ) {
        return null;
      }

      const currentUser = JSON.parse(rawUser);

      console.log(
        "Checkout - parsed user:",
        currentUser
      );

      const userId =
        currentUser?.uid ||
        currentUser?.user_id ||
        currentUser?.id ||
        null;

      console.log(
        "Checkout - Firebase UID:",
        userId
      );

      if (!userId) {
        return null;
      }

      return String(userId);
    } catch (error) {
      console.error(
        "Checkout - failed to read user:",
        error
      );

      return null;
    }
  };

  // ---------------------------------------------------------
  // Handle checkout
  // ---------------------------------------------------------

  const handleCheckout = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (processing) {
      return;
    }

    try {
      setProcessing(true);

      // -----------------------------------------------------
      // Make sure cart has products
      // -----------------------------------------------------

      if (!cart || cart.length === 0) {
        throw new Error(
          "Your cart is empty."
        );
      }

      // -----------------------------------------------------
      // Get Firebase user ID
      // -----------------------------------------------------

      const userId = getUserId();

      if (!userId) {
        throw new Error(
          "You must be logged in before placing an order."
        );
      }

      // -----------------------------------------------------
      // Build shipping address
      // -----------------------------------------------------

      const shippingAddress = [
        formData.address.trim(),
        formData.city.trim(),
        formData.state.trim(),
        formData.zipCode.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      // -----------------------------------------------------
      // Prepare customer information
      // -----------------------------------------------------

      const customerEmail =
        formData.email
          .trim()
          .toLowerCase();

      const fullName =
        formData.fullName.trim();

      const phone =
        formData.phone.trim();

      // -----------------------------------------------------
      // Prepare order information
      //
      // IMPORTANT:
      //
      // This is NOT saved to Firestore here.
      //
      // The Stripe webhook creates the actual Firestore
      // order after Stripe confirms successful payment.
      // -----------------------------------------------------

      const orderData = {
        user_id: userId,

        items: cart,

        price: Number(
          subtotal.toFixed(2)
        ),

        shipping: Number(
          shipping.toFixed(2)
        ),

        tax: Number(
          tax.toFixed(2)
        ),

        total: Number(
          total.toFixed(2)
        ),

        fullName,

        phone,

        shippingAddress,

        customerEmail,

        status: "Paid / Processing",

        createdAt:
          new Date().toISOString(),
      };

      console.log(
        "Checkout - order information:",
        orderData
      );

      // -----------------------------------------------------
      // Save shipping information locally
      //
      // This is only used to preserve checkout information.
      // It does NOT create an order.
      // -----------------------------------------------------

      localStorage.setItem(
        "shipped_address",
        JSON.stringify({
          fullName,
          email: customerEmail,
          phone,
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        })
      );

      // -----------------------------------------------------
      // Create Stripe Checkout Session
      //
      // IMPORTANT:
      //
      // We send the order information to /api/payment.
      //
      // The payment route creates the Stripe session.
      //
      // The webhook creates the Firestore order ONLY after
      // successful payment.
      // -----------------------------------------------------

      console.log(
        "Checkout - creating Stripe payment session..."
      );

      const response = await fetch(
        "/api/payment",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            // Cart items
            items: cart,

            // Order totals
            price: Number(
              subtotal.toFixed(2)
            ),

            shipping: Number(
              shipping.toFixed(2)
            ),

            tax: Number(
              tax.toFixed(2)
            ),

            total: Number(
              total.toFixed(2)
            ),

            // Firebase user
            user_id: userId,

            // Customer information
            fullName,

            phone,

            shippingAddress,

            customerEmail,
          }),
        }
      );

      // -----------------------------------------------------
      // Read payment API response
      // -----------------------------------------------------

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        console.error(
          "Checkout - invalid payment API response:",
          text
        );

        throw new Error(
          "The payment server returned an invalid response."
        );
      }

      console.log(
        "Checkout - payment API response:",
        data
      );

      // -----------------------------------------------------
      // Check payment API response
      // -----------------------------------------------------

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Something went wrong creating the payment session."
        );
      }

      // -----------------------------------------------------
      // Save pending payment information locally
      //
      // IMPORTANT:
      //
      // This does NOT create a Firestore order.
      //
      // It is only useful for keeping track of the Stripe
      // checkout session on the browser.
      // -----------------------------------------------------

      localStorage.setItem(
        "pending_order",
        JSON.stringify({
          ...orderData,
          stripeSessionId:
            data.sessionId || null,
        })
      );

      // -----------------------------------------------------
      // Redirect to Stripe
      // -----------------------------------------------------

      if (data.url) {
        console.log(
          "Checkout - redirecting to Stripe..."
        );

        window.location.href =
          data.url;

        return;
      }

      throw new Error(
        "Stripe checkout URL was not returned."
      );
    } catch (error: any) {
      console.error(
        "Checkout error:",
        error
      );

      alert(
        error?.message ||
          "Something went wrong during checkout. Please try again."
      );

      setProcessing(false);
    }
  };

  // ---------------------------------------------------------
  // Empty cart
  // ---------------------------------------------------------

  if (cart.length === 0) {
    return (
      <div
        className={
          styles.checkoutContainer
        }
      >
        <div
          className={
            styles.emptyState
          }
        >
          <h2>
            Your cart is empty!
          </h2>

          <p
            style={{
              margin: "15px 0",
            }}
          >
            Add some glowsticks before
            heading to checkout.
          </p>

          <Link
            href="/glowsticks"
            className={
              styles.placeOrderBtn
            }
            style={{
              display:
                "inline-block",
              textDecoration:
                "none",
              textAlign: "center",
              width: "auto",
              padding:
                "10px 20px",
            }}
          >
            Browse Glow Sticks
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Checkout page
  // ---------------------------------------------------------

  return (
    <div
      className={
        styles.checkoutContainer
      }
    >
      <h1
        className={
          styles.checkoutTitle
        }
      >
        Checkout
      </h1>

      <form
        onSubmit={handleCheckout}
        className={
          styles.checkoutGrid
        }
      >
        {/* -------------------------------------------------
            Delivery Information
        -------------------------------------------------- */}

        <div
          className={
            styles.checkoutForm
          }
        >
          <h2
            className={
              styles.sectionTitle
            }
          >
            Delivery Information
          </h2>

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              type="text"
              id="fullName"
              name="fullName"
              required
              className={
                styles.formInput
              }
              value={
                formData.fullName
              }
              onChange={
                handleChange
              }
              placeholder="Andrew Smith"
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="email">
              Email Address
            </label>

            <input
              type="email"
              id="email"
              name="email"
              required
              className={
                styles.formInput
              }
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              placeholder="andrew@example.com"
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className={
                styles.formInput
              }
              value={
                formData.phone
              }
              onChange={
                handleChange
              }
              placeholder="(352) 555-0199"
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <label htmlFor="address">
              Street Address
            </label>

            <input
              type="text"
              id="address"
              name="address"
              required
              className={
                styles.formInput
              }
              value={
                formData.address
              }
              onChange={
                handleChange
              }
              placeholder="123 Glow Street"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="city">
                City
              </label>

              <input
                type="text"
                id="city"
                name="city"
                required
                className={
                  styles.formInput
                }
                value={
                  formData.city
                }
                onChange={
                  handleChange
                }
                placeholder="Gainesville"
              />
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="state">
                State
              </label>

              <input
                type="text"
                id="state"
                name="state"
                required
                className={
                  styles.formInput
                }
                value={
                  formData.state
                }
                onChange={
                  handleChange
                }
                placeholder="FL"
              />
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="zipCode">
                Zip Code
              </label>

              <input
                type="text"
                id="zipCode"
                name="zipCode"
                required
                className={
                  styles.formInput
                }
                value={
                  formData.zipCode
                }
                onChange={
                  handleChange
                }
                placeholder="32601"
              />
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            Order Summary
        -------------------------------------------------- */}

        <div
          className={
            styles.summaryColumn
          }
        >
          <h2
            className={
              styles.sectionTitle
            }
          >
            Order Summary
          </h2>

          <div
            className={
              styles.summaryList
            }
          >
            {cart.map(
              (
                item: any,
                index: number
              ) => {
                const itemQuantity =
                  Number(
                    item.quantity
                  ) || 1;

                const itemPrice =
                  Number(
                    item.price
                  ) || 0;

                return (
                  <div
                    key={
                      item.id ||
                      index
                    }
                    className={
                      styles.summaryItem
                    }
                  >
                    <div
                      className={
                        styles.itemImageWrapper
                      }
                    >
                      <Image
                        src={
                          item.image
                        }
                        alt={
                          item.name ||
                          "Glow Stick"
                        }
                        width={60}
                        height={60}
                        className={
                          styles.itemImage
                        }
                      />
                    </div>

                    <div
                      className={
                        styles.itemDetails
                      }
                    >
                      <h3
                        className={
                          styles.itemName
                        }
                      >
                        {
                          item.name
                        }
                      </h3>

                      <span
                        className={
                          styles.itemMeta
                        }
                      >
                        Qty:{" "}
                        {
                          itemQuantity
                        }
                      </span>

                      <span
                        className={
                          styles.itemMeta
                        }
                      >
                        $
                        {(
                          itemPrice *
                          itemQuantity
                        ).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* -------------------------------------------------
              Price Breakdown
          -------------------------------------------------- */}

          <div
            className={
              styles.summaryBreakdown
            }
          >
            <div
              className={
                styles.summaryRow
              }
            >
              <span>
                Subtotal:
              </span>

              <span>
                $
                {subtotal.toFixed(
                  2
                )}
              </span>
            </div>

            <div
              className={
                styles.summaryRow
              }
            >
              <span>
                Shipping:
              </span>

              <span>
                $
                {shipping.toFixed(
                  2
                )}
              </span>
            </div>

            <div
              className={
                styles.summaryRow
              }
            >
              <span>
                Estimated Tax
                (7%):
              </span>

              <span>
                $
                {tax.toFixed(
                  2
                )}
              </span>
            </div>
          </div>

          {/* -------------------------------------------------
              Total
          -------------------------------------------------- */}

          <div
            className={
              styles.totalSection
            }
          >
            <span>
              Total:
            </span>

            <span>
              $
              {total.toFixed(
                2
              )}
            </span>
          </div>

          {/* -------------------------------------------------
              Place Order
          -------------------------------------------------- */}

          <button
            type="submit"
            className={
              styles.placeOrderBtn
            }
            disabled={
              processing
            }
          >
            {processing
              ? "Processing..."
              : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

