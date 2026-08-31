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
      const qty = Number(item.quantity) || 1;

      return total + price * qty;
    },
    0
  );

  const shipping = subtotal > 0 ? 5.0 : 0.0;

  const tax = subtotal * 0.07;

  const total = subtotal + shipping + tax;

  // ---------------------------------------------------------
  // Get logged-in user ID
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
        "Checkout - Firebase user ID:",
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
        formData.address,
        formData.city,
        formData.state,
        formData.zipCode,
      ]
        .filter(Boolean)
        .join(", ");

      // -----------------------------------------------------
      // Build order
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

        phone: formData.phone,

        shippingAddress,

        customerEmail:
          formData.email.trim().toLowerCase(),

        status: "Paid / Processing",

        createdAt:
          new Date().toISOString(),
      };

      console.log(
        "Checkout - order being prepared:",
        orderData
      );

      // -----------------------------------------------------
      // Save order to Firebase
      // -----------------------------------------------------

      console.log(
        "Checkout - saving order to Firebase..."
      );

      const saveResponse = await fetch(
        "/api/orders/save",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            orderData
          ),
        }
      );

      const saveText =
        await saveResponse.text();

      let saveData: any = {};

      try {
        saveData = saveText
          ? JSON.parse(saveText)
          : {};
      } catch {
        console.error(
          "Checkout - invalid save order response:",
          saveText
        );

        throw new Error(
          "The order server returned an invalid response."
        );
      }

      console.log(
        "Checkout - save order response:",
        saveData
      );

      if (!saveResponse.ok || !saveData.success) {
        throw new Error(
          saveData?.error ||
            saveData?.message ||
            "Failed to save your order."
        );
      }

      console.log(
        "Checkout - order saved successfully:",
        saveData.orderId
      );

      // -----------------------------------------------------
      // Save recent order locally as a backup
      // -----------------------------------------------------

      localStorage.setItem(
        "recent_order",
        JSON.stringify({
          ...orderData,
          orderId:
            saveData.orderId || null,
        })
      );

      // -----------------------------------------------------
      // Save shipping information locally
      // -----------------------------------------------------

      localStorage.setItem(
        "shipped_address",
        JSON.stringify({
          fullName:
            formData.fullName,

          email:
            formData.email,

          phone:
            formData.phone,

          address:
            formData.address,

          city:
            formData.city,

          state:
            formData.state,

          zipCode:
            formData.zipCode,
        })
      );

      // -----------------------------------------------------
      // Create Stripe Checkout Session
      // -----------------------------------------------------

      console.log(
        "Checkout - creating Stripe session..."
      );

      const response = await fetch(
        "/api/webhook",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            items: cart,
            shipping,
            tax,
          }),
        }
      );

      const text =
        await response.text();

      let data: any = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        console.error(
          "Invalid response from checkout API:",
          text
        );

        throw new Error(
          "Invalid response from checkout server."
        );
      }

      console.log(
        "Checkout - Stripe response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Something went wrong creating the checkout session."
        );
      }

      // -----------------------------------------------------
      // Redirect to Stripe
      // -----------------------------------------------------

      if (data.url) {
        window.location.href =
          data.url;

        return;
      }

      throw new Error(
        "Stripe checkout URL was not returned."
      );
    } catch (error: any) {
      console.error(
        "Error during checkout:",
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
              display:
                "grid",
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

