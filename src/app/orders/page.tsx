"use client"; 
import Image from "next/image"; 
import { useEffect, useState } from "react"; 
import styles from "./page.orders.module.css"; 
import Link from "next/link"; 
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from "@/lib/db"; 
 
type OrderItem = { 
  name: string; 
  image: string; 
  quantity: number; 
  price: number; 
  description?: string; 
}; 
 
type Order = { 
  id: string; 
  items: OrderItem[]; 
  status: string; 
  paymentStatus: string; 
  price: string; 
  shipping: string; 
  tax: string; 
  total: string; 
}; 
 
export default function OrdersPage() { 
  const [orders, setOrders] = useState<Order[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null); 
 
  // ========================================================= 
  // GET IMAGE URL 
  // ========================================================= 
 
  const getImageUrl = (image: any): string => { 
    if (!image) { 
      return ""; 
    } 
 
    // Normal URL string 
    if (typeof image === "string") { 
      return image.trim(); 
    } 
 
    // Next.js imported image object 
    if (typeof image === "object" && image !== null) { 
      if (typeof image.src === "string" && image.src.trim() !== "") { 
        return image.src.trim(); 
      } 
 
      if ( 
        typeof image.default?.src === "string" && 
        image.default.src.trim() !== "" 
      ) { 
        return image.default.src.trim(); 
      } 
 
      if (typeof image.url === "string" && image.url.trim() !== "") { 
        return image.url.trim(); 
      } 
 
      if ( 
        typeof image.default?.url === "string" && 
        image.default.url.trim() !== "" 
      ) { 
        return image.default.url.trim(); 
      } 
    } 
 
    return ""; 
  }; 
 
  // ========================================================= 
  // FORMAT ORDERS 
  // ========================================================= 
 
  const formatOrders = (databaseOrders: any[]): Order[] => { 
    console.log("======================================"); 
    console.log("🔎 ORDERS DEBUG: formatOrders received"); 
    console.log("Number of database orders:", databaseOrders.length); 
    console.log("======================================"); 
 
    return databaseOrders.map((order: any) => { 
      let rawItems: any[] = []; 
 
      // ------------------------------------------------------- 
      // PARSE ITEMS 
      // ------------------------------------------------------- 
 
      try { 
        if (Array.isArray(order.items)) { 
          rawItems = order.items; 
        } else if ( 
          typeof order.items === "string" && 
          order.items.trim() !== "" 
        ) { 
          const parsed = JSON.parse(order.items); 
 
          if (Array.isArray(parsed)) { 
            rawItems = parsed; 
          } 
        } 
      } catch (error) { 
        console.error("❌ Orders - failed to parse items:", error); 
      } 
 
      console.log("📦 Raw order items:", rawItems); 
 
      // ------------------------------------------------------- 
      // FORMAT EACH PRODUCT SEPARATELY 
      // ------------------------------------------------------- 
 
      const items: OrderItem[] = rawItems.map((item: any) => { 
        const image = getImageUrl(item?.image); 
 
        const quantity = Number(item?.quantity) || 1; 
 
        const price = Number(item?.price) || 0; 
 
        console.log("🖼️ PRODUCT IMAGE DEBUG:", { 
          orderId: order.id, 
          productName: item?.name, 
          originalImage: item?.image, 
          image, 
          imageType: typeof item?.image, 
          quantity, 
          price, 
        }); 
 
        if (!image) { 
          console.warn( 
            "⚠️ NO PRODUCT IMAGE FOUND FOR:", 
            item?.name || "Unknown Product", 
          ); 
        } 
 
        return { 
          name: item?.name || "Glow Stick", 
          image, 
          quantity, 
          price, 
          description: item?.description || "", 
        }; 
      }); 
 
      // ------------------------------------------------------- 
      // ORDER IMAGE FALLBACK 
      // ------------------------------------------------------- 
 
      if (items.length === 0 && order?.image) { 
        const fallbackImage = getImageUrl(order.image); 
 
        if (fallbackImage) { 
          items.push({ 
            name: "GlowRush Order", 
            image: fallbackImage, 
            quantity: 1, 
            price: Number(order?.price) || 0, 
            description: "", 
          }); 
        } 
      } 
 
      // ------------------------------------------------------- 
      // FULL ORDER DEBUG 
      // ------------------------------------------------------- 
 
      console.log("📦 Formatting order:", { 
        id: order.id, 
        user_id: order.user_id, 
        items, 
        paymentStatus: order.paymentStatus, 
        status: order.status, 
        price: order.price, 
        shipping: order.shipping, 
        tax: order.tax, 
        total: order.total, 
      }); 
 
      return { 
        id: `ORD-${order.id}`, 
 
        items, 
 
        status: order.status || "Paid / Processing", 
 
        paymentStatus: order.paymentStatus || "", 
 
        price: `$${Number(order.price || 0).toFixed(2)}`, 
 
        shipping: `$${Number(order.shipping || 0).toFixed(2)}`, 
 
        tax: `$${Number(order.tax || 0).toFixed(2)}`, 
 
        total: `$${Number(order.total || 0).toFixed(2)}`, 
      }; 
    }); 
  }; 
 
  // ========================================================= 
  // LOAD ORDERS 
  // ========================================================= 
 
  const loadOrders = async (firebaseUser: any) => { 
    try { 
      console.log("======================================"); 
      console.log("🔎 ORDERS DEBUG: START"); 
      console.log("======================================"); 
 
      // ------------------------------------------------------- 
      // FIREBASE USER 
      // ------------------------------------------------------- 
 
      console.log("🔎 Firebase user object:", firebaseUser); 
 
      if (!firebaseUser) { 
        console.error("❌ firebaseUser is NULL/UNDEFINED"); 
 
        setOrders([]); 
 
        return; 
      } 
 
      console.log("✅ Firebase user exists"); 
      console.log("🔎 Firebase UID:", firebaseUser.uid); 
      console.log("🔎 Firebase email:", firebaseUser.email); 
 
      // ------------------------------------------------------- 
      // UID 
      // ------------------------------------------------------- 
 
      const userId = firebaseUser.uid; 
 
      if (!userId) { 
        console.error("❌ Firebase user has NO UID"); 
 
        setOrders([]); 
 
        return; 
      } 
 
      console.log("✅ UID exists:", userId); 
 
      // ------------------------------------------------------- 
      // FIREBASE ID TOKEN 
      // ------------------------------------------------------- 
 
      console.log("🔎 Requesting Firebase ID token..."); 
 
      const token = await firebaseUser.getIdToken(true); 
 
      if (!token) { 
        console.error("❌ Firebase ID token is EMPTY"); 
 
        setOrders([]); 
 
        return; 
      } 
 
      console.log("✅ Firebase ID token received"); 
 
      // ------------------------------------------------------- 
      // API URL 
      // ------------------------------------------------------- 
 
      const apiUrl = `/api/orders/get?user_id=${encodeURIComponent(userId)}`; 
 
      console.log("🔎 ORDERS API URL:", apiUrl); 
      console.log("🔎 user_id being sent:", userId); 
 
      // ------------------------------------------------------- 
      // CALL API 
      // ------------------------------------------------------- 
 
      const response = await fetch(apiUrl, { 
        method: "GET", 
 
        headers: { 
          Authorization: `Bearer ${token}`, 
        }, 
 
        cache: "no-store", 
      }); 
 
      console.log("🔎 Orders API HTTP status:", response.status); 
 
      // ------------------------------------------------------- 
      // RAW RESPONSE 
      // ------------------------------------------------------- 
 
      const responseText = await response.text(); 
 
      console.log("🔎 RAW ORDERS API RESPONSE:", responseText); 
 
      // ------------------------------------------------------- 
      // PARSE JSON 
      // ------------------------------------------------------- 
 
      let data: any = {}; 
 
      try { 
        data = responseText ? JSON.parse(responseText) : {}; 
      } catch (error) { 
        console.error("❌ Orders API returned INVALID JSON", error); 
 
        setOrders([]); 
 
        return; 
      } 
 
      console.log("✅ Parsed Orders API response:", data); 
 
      // ------------------------------------------------------- 
      // HTTP ERROR 
      // ------------------------------------------------------- 
 
      if (!response.ok) { 
        console.error("❌ ORDERS API ERROR:", data?.error); 
 
        setOrders([]); 
 
        return; 
      } 
 
      // ------------------------------------------------------- 
      // API SUCCESS 
      // ------------------------------------------------------- 
 
      if (!data.success) { 
        console.error("❌ Orders API success=false:", data?.error); 
 
        setOrders([]); 
 
        return; 
      } 
 
      // ------------------------------------------------------- 
      // DATABASE ORDERS 
      // ------------------------------------------------------- 
 
      const databaseOrders = Array.isArray(data.orders) ? data.orders : []; 
 
      console.log("======================================"); 
      console.log("📦 FIRESTORE ORDERS RECEIVED"); 
      console.log("Number of orders:", databaseOrders.length); 
      console.log("Full orders:", databaseOrders); 
      console.log("======================================"); 
 
      // ------------------------------------------------------- 
      // INSPECT ORDERS 
      // ------------------------------------------------------- 
 
      databaseOrders.forEach((order: any, index: number) => { 
        console.log(`📦 ORDER ${index + 1}`); 
        console.log("Document ID:", order.id); 
        console.log("Stored user_id:", order.user_id); 
        console.log("Payment status:", order.paymentStatus); 
        console.log("Status:", order.status); 
        console.log("Items:", order.items); 
      }); 
 
      // ------------------------------------------------------- 
      // FILTER PAID ORDERS 
      // ------------------------------------------------------- 
 
      const paidOrders = databaseOrders.filter((order: any) => { 
        const paymentStatus = String(order.paymentStatus || "") 
          .trim() 
          .toLowerCase(); 
 
        return paymentStatus === "paid"; 
      }); 
 
      console.log("💳 PAID ORDERS:", paidOrders.length); 
 
      // ------------------------------------------------------- 
      // SORT NEWEST FIRST 
      // ------------------------------------------------------- 
 
      paidOrders.sort((a: any, b: any) => { 
        const dateA = new Date(a.createdAt || 0).getTime(); 
 
        const dateB = new Date(b.createdAt || 0).getTime(); 
 
        return dateB - dateA; 
      }); 
 
      // ------------------------------------------------------- 
      // FORMAT ORDERS 
      // ------------------------------------------------------- 
 
      const formattedOrders = formatOrders(paidOrders); 
 
      console.log("======================================"); 
      console.log("✅ FORMATTED ORDERS:", formattedOrders); 
      console.log("======================================"); 
 
      setOrders(formattedOrders); 
 
      console.log("✅ Orders state updated"); 
    } catch (error: any) { 
      console.error("======================================"); 
      console.error("❌ ORDERS LOAD CRASHED"); 
      console.error(error); 
      console.error(error?.message); 
      console.error("======================================"); 
 
      setOrders([]); 
    } 
  }; 
 
  // ========================================================= 
  // FIREBASE AUTH 
  // ========================================================= 
 
  useEffect(() => { 
    console.log("🔎 Orders - waiting for Firebase authentication..."); 
 
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => { 
      try { 
        if (!firebaseUser) { 
          console.warn("⚠️ No Firebase user is signed in."); 
 
          setOrders([]); 
 
          setLoading(false); 
 
          return; 
        } 
 
        console.log("✅ FIREBASE USER AUTHENTICATED"); 
        console.log("Firebase UID:", firebaseUser.uid); 
 
        await loadOrders(firebaseUser); 
      } catch (error) { 
        console.error("❌ Authentication error:", error); 
 
        setOrders([]); 
 
      } finally { 
        setLoading(false); 
      } 
    }); 
 
    return () => { 
      unsubscribe(); 
    }; 
  }, []); 
 
  // ========================================================= 
  // TRACK ORDER 
  // ========================================================= 
 
  const trackOrder = async (orderId: string) => { 
    try { 
      setTrackingOrder(orderId); 
 
      const firebaseUser = auth.currentUser; 
 
      if (!firebaseUser) { 
        console.error("❌ Cannot track order: no Firebase user."); 
 
        return; 
      } 
 
      await loadOrders(firebaseUser); 
    } catch (error) { 
      console.error("❌ Failed to refresh orders:", error); 
    } finally { 
      setTrackingOrder(null); 
    } 
  }; 
 
  // ========================================================= 
  // CANCEL ORDER 
  // ========================================================= 
 
  const handleCancelOrder = async (orderId: string) => { 
    try { 
      const firestoreId = orderId.startsWith("ORD-") 
        ? orderId.substring(4) 
        : orderId; 
 
      const firebaseUser = auth.currentUser; 
 
      if (!firebaseUser) { 
        console.error("❌ Cannot cancel order: no Firebase user."); 
 
        return; 
      } 
 
      const token = await firebaseUser.getIdToken(true); 
 
      const response = await fetch("/api/orders/delete", { 
        method: "POST", 
 
        headers: { 
          "Content-Type": "application/json", 
 
          Authorization: `Bearer ${token}`, 
        }, 
 
        body: JSON.stringify({ 
          id: firestoreId, 
        }), 
      }); 
 
      const text = await response.text(); 
 
      let data: any = {}; 
 
      try { 
        data = text ? JSON.parse(text) : {}; 
      } catch { 
        console.error("❌ Invalid delete response:", text); 
 
        return; 
      } 
 
      if (data.success) { 
        setOrders((previousOrders) => 
          previousOrders.filter((order) => order.id !== orderId), 
        ); 
      } else { 
        console.error("❌ Failed to cancel order:", data?.error); 
      } 
    } catch (error) { 
      console.error("❌ Cancel order error:", error); 
    } 
  }; 
 
  // ========================================================= 
  // PAGE 
  // ========================================================= 
 
  return ( 
    <div className={styles.container}> 
      <h1 className={styles.title}>Your Orders</h1> 
 
      {loading ? ( 
        <div className={styles.emptyState}> 
          <p>Loading orders...</p> 
        </div> 
      ) : orders.length === 0 ? ( 
        <div className={styles.emptyState}> 
          <p>No completed orders found.</p> 
 
          <Link href="/glowsticks" className={styles.shopGlowBtn}> 
            Shop Glow Sticks 
          </Link> 
        </div> 
      ) : ( 
        <div className={styles.ordersList}> 
          {orders.map((order) => ( 
            <div key={order.id} className={styles.orderCard}> 
              {/* ========================================== 
                    LEFT SIDE 
                ========================================== */} 
 
              <div className={styles.orderLeft}> 
                <div className={styles.orderDetails}> 
                  <h3>{order.id}</h3> 
 
                  <span className={styles.statusBadge}> 
                    Status: {order.status} 
                  </span> 
                </div> 
              </div> 
 
              {/* ========================================== 
                    PRODUCTS 
                ========================================== */} 
 
              <div 
                style={{ 
                  width: "100%", 
                  marginTop: "20px", 
                  marginBottom: "20px", 
                }} 
              > 
                {order.items.map((item, index) => ( 
                  <div 
                    key={`${order.id}-${index}`} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "16px", 
                      padding: "14px 0", 
                      borderBottom: 
                        index < order.items.length - 1 
                          ? "1px solid #e5e5e5" 
                          : "none", 
                    }} 
                  > 
                    {/* PRODUCT IMAGE */} 
 
                    {item.image ? ( 
                      <Image 
                        src={item.image} 
                        width={80} 
                        height={80} 
                        className={styles.productImg} 
                        alt={item.name} 
                        unoptimized 
                        onError={() => { 
                          console.error("❌ PRODUCT IMAGE FAILED TO LOAD:", { 
                            orderId: order.id, 
                            productName: item.name, 
                            image: item.image, 
                          }); 
                        }} 
                      /> 
                    ) : ( 
                      <div 
                        style={{ 
                          width: "80px", 
                          height: "80px", 
                          minWidth: "80px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          border: "1px solid #ddd", 
                          borderRadius: "8px", 
                          fontSize: "12px", 
                          textAlign: "center", 
                        }} 
                      > 
                        No image 
                      </div> 
                    )} 
 
                    {/* PRODUCT INFORMATION */} 
 
                    <div 
                      style={{ 
                        flex: 1, 
                      }} 
                    > 
                      <h3 
                        style={{ 
                          margin: "0 0 6px 0", 
                          color:"yellowgreen", 
                        }} 
                      > 
                        {item.name} 
                      </h3> 
 
                      <p 
                        style={{ 
                          margin: "0 0 5px 0", 
                          color:"rgb(219, 255, 148)" 
                        }} 
                      > 
                        Quantity:{" "} 
                        <span style={{ color: "yellowgreen" }}> 
                          {item.quantity} 
                        </span> 
                      </p> 
 
                      <p 
                        style={{ 
                          margin: 0, 
                          color:"rgb(219, 255, 148)", 
                        }} 
                      > 
                        Price:{" "} 
                        <span style={{ color: "yellowgreen" }}> 
                          ${Number(item.price || 0).toFixed(2)} 
                        </span> 
                      </p> 
 
                      {item.description && ( 
                        <p 
                          style={{ 
                            margin: "6px 0 0 0", 
                            fontSize: "14px", 
                            color:'rgb(219, 255, 148)' 
                          }} 
                        > 
                          {item.description} 
                        </p> 
                      )} 
                    </div> 
                  </div> 
                ))} 
              </div> 
 
              {/* ========================================== 
                    RIGHT SIDE / ORDER TOTALS 
                ========================================== */} 
 
              <div className={styles.orderRight}> 
                <div className={styles.priceInfo}> 
                  Price: <span>{order.price}</span> 
                </div> 
 
                <div className={styles.priceInfo}> 
                  Shipping: <span>{order.shipping}</span> 
                </div> 
 
                <div className={styles.priceInfo}> 
                  Tax: <span>{order.tax}</span> 
                </div> 
 
                <div className={styles.priceInfo}> 
                  Total: <span>{order.total}</span> 
                </div> 
 
                <div className={styles.buttonGroup}> 
                  <button 
                    onClick={() => trackOrder(order.id)} 
                    className={styles.trackBtn} 
                    disabled={trackingOrder === order.id} 
                  > 
                    {trackingOrder === order.id ? "Checking..." : "Track Order"} 
                  </button> 
 
                  {order.status === "Paid / Processing" && ( 
                    <button 
                      className={styles.cancelBtn} 
                      onClick={() => handleCancelOrder(order.id)} 
                    > 
                      Cancel Order 
                    </button> 
                  )} 
                </div> 
              </div> 
            </div> 
          ))} 
        </div> 
      )} 
    </div> 
  ); 
}

