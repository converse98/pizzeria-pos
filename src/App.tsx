import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Definiciones de Tipos e Interfaces ---
type PizzaSizeLabel = 'Personal' | 'Compartida' | 'Familiar';
type Category = 'Clásicas' | 'Especiales' | 'Combos' | 'Combos Plus' | 'Combos Compartidas' | 'Acompañamientos' | 'Personalizada' | 'Todas';
type ProductType = 'classic' | 'special';

interface BaseProduct {
    id: string;
    name: string;
    category: Category;
    prices: number[]; // [Personal, Compartida, Familiar]
    ingredients: string[];
    img: string;
    isCombo?: boolean;
    isSide?: boolean;
    isCustomizable?: boolean;
    type?: ProductType;
}

interface Extra {
    id: string;
    name: string;
    price: number;
    isVegetable?: boolean;
    count?: number; // Usado en CartItem
}

interface CartItemCustomization {
    size: PizzaSizeLabel | null;
    isHalfHalf: boolean;
    comment: string;
    selectedExtras: Extra[];
    pizzaHalf1: { id: string, name: string } | null;
    pizzaHalf2: { id: string, name: string } | null;
}

interface CartItem extends CartItemCustomization {
    id: string; // ID local único
    productId: string;
    name: string;
    category: Category;
    finalPrice: number;
    quantity: number;
    timestamp: Date; // Usamos Date local
}

interface ToastMessage {
    type: 'success' | 'error';
    text: string;
}

// Función de utilidad para generar IDs únicos locales
const generateUniqueId = (): string => `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- Global Constants (Ahora solo locales) ---
const PIZZA_SIZES: { [key: string]: PizzaSizeLabel } = {
    PERSONAL: 'Personal',
    COMPARTIDA: 'Compartida',
    FAMILIAR: 'Familiar',
};
const SIZE_MAP: { [key in PizzaSizeLabel]: number } = {
    'Personal': 0,
    'Compartida': 1,
    'Familiar': 2,
};
const MONEDA: string = 'S/';

// --- Data de Productos (Tipado como BaseProduct[]) ---
const PRODUCT_DATA: BaseProduct[] = [
    // PIZZAS CLASICAS
    { id: 'p1', name: 'La Mozarella', category: 'Clásicas', prices: [7.00, 14.00, 20.00], ingredients: ['salsa de tomate', 'queso mozarella'], img: '🧀', type: 'classic' },
    { id: 'p2', name: 'Napolitana', category: 'Clásicas', prices: [8.00, 15.00, 21.00], ingredients: ['salsa de tomate', 'queso', 'mozarella', 'aceitunas'], img: '🫒', type: 'classic' },
    { id: 'p3', name: 'La Misia', category: 'Clásicas', prices: [9.00, 16.00, 22.00], ingredients: ['salsa de tomate', 'queso', 'mozarella', 'hotdog'], img: '🌭', type: 'classic' },
    { id: 'p4', name: 'Americana', category: 'Clásicas', prices: [9.00, 17.00, 23.00], ingredients: ['salsa de tomate', 'queso mozarella', 'jamón pizzero'], img: '🍖', type: 'classic' },
    { id: 'p5', name: 'Choripizza', category: 'Clásicas', prices: [10.00, 18.00, 23.00], ingredients: ['salsa de tomate', 'queso mozarella', 'chorizo argentino'], img: '🥩', type: 'classic' },
    { id: 'p6', name: 'Española', category: 'Clásicas', prices: [10.00, 19.00, 24.00], ingredients: ['salsa de tomate', 'queso mozarella', 'chorizo argentino', 'aceitunas'], img: '🇪🇸', type: 'classic' },
    { id: 'p7', name: 'Vegetariana', category: 'Clásicas', prices: [12.00, 19.00, 25.00], ingredients: ['salsa de tomate', 'queso mozarella', 'aros de cebolla', 'tomates en rodajas', 'champiñones'], img: '🥦', type: 'classic' },
    { id: 'p8', name: 'Mixta', category: 'Clásicas', prices: [12.00, 19.00, 25.00], ingredients: ['salsa de tomate', 'queso mozarella', 'hotdog', 'jamón pizzero', 'pimientos'], img: '🌶️', type: 'classic' },
    { id: 'p9', name: 'Peperoni', category: 'Clásicas', prices: [12.00, 19.00, 25.00], ingredients: ['salsa de tomate', 'queso mozarella', 'peperoni'], img: '🍕', type: 'classic' },
    { id: 'p10', name: 'Granjera', category: 'Clásicas', prices: [12.00, 20.00, 26.00], ingredients: ['salsa de tomate', 'queso mozarella', 'jamón', 'champiñones', 'aceituna'], img: '🐔', type: 'classic' },

    // PIZZAS ESPECIALES
    { id: 's1', name: 'Alemana', category: 'Especiales', prices: [12.00, 20.00, 26.00], ingredients: ['salsa de tomate', 'queso mozarella', 'chorizo', 'tocino', 'hotdog'], img: '🇩🇪', type: 'special' },
    { id: 's2', name: 'Hawaiana', category: 'Especiales', prices: [12.00, 20.00, 26.00], ingredients: ['salsa de tomate', 'queso mozarella', 'jamón pizzero', 'piña', 'durazno'], img: '🍍', type: 'special' },
    { id: 's3', name: 'Suprema', category: 'Especiales', prices: [13.00, 20.00, 26.00], ingredients: ['salsa de tomate', 'queso mozarella', 'peperoni', 'hotdog', 'tocino'], img: '👑', type: 'special' },
    { id: 's4', name: 'Italiana', category: 'Especiales', prices: [14.00, 21.00, 27.00], ingredients: ['salsa de tomate', 'queso mozarella', 'chorizo', 'tocino', 'aceituna', 'cebolla', 'pimientos'], img: '🇮🇹', type: 'special' },
    { id: 's5', name: 'Marocchinos', category: 'Especiales', prices: [15.00, 26.00, 32.00], ingredients: ['salsa de tomate', 'queso mozarella', 'peperoni', 'hotdog', 'aceituna', 'tocino', 'pimientos', 'champiñones'], img: '🍄', type: 'special' },
    { id: 's6', name: 'Puerca', category: 'Especiales', prices: [15.00, 26.00, 32.00], ingredients: ['salsa de tomate', 'queso mozarella', 'jamón pizzero', 'chorizo', 'hotdog', 'aceituna', 'tocino', 'pimientos'], img: '🐷', type: 'special' },

    // COMBOS (Solo un precio base, usando índice 0)
    { id: 'c1', name: 'Combo Pizzero 1', category: 'Combos', prices: [27.00, 0, 0], ingredients: ['1 pizza americana familiar', 'coca/inka de 1 litro'], img: '🥤', isCombo: true },
    { id: 'c2', name: 'Combo Pizzero 2', category: 'Combos', prices: [34.00, 0, 0], ingredients: ['1 pizza familiar a elección', 'coca/inka de 1 litro', 'pan al ajo'], img: '🥖', isCombo: true },
    { id: 'c3', name: 'Combo Pizzero 3', category: 'Combos', prices: [42.00, 0, 0], ingredients: ['1 pizza americana familiar', '1 choripizza'], img: '🤝', isCombo: true },
    { id: 'c4', name: 'Combo Pizzero 4', category: 'Combos', prices: [52.00, 0, 0], ingredients: ['2 pizzas americana familiares', 'coca/inka de 1 litro', 'pan al ajo'], img: '🎉', isCombo: true },
    { id: 'c5', name: 'Combo Pizzero 5', category: 'Combos', prices: [43.00, 0, 0], ingredients: ['2 pizzas a escoger entre mozarella, misia, americana, choripizza'], img: '🎁', isCombo: true },
    { id: 'c6', name: 'Combo Pizzero 6', category: 'Combos', prices: [40.00, 0, 0], ingredients: ['2 pizzas a escoger entre mozarella, misia, napolitana'], img: '🎈', isCombo: true },

    // COMBOS PLUS (Solo un precio base, usando índice 0)
    { id: 'cp1', name: 'Combo Pizzero Americanas', category: 'Combos Plus', prices: [52.00, 0, 0], ingredients: ['2 pizzas familiares', 'gaseosa coca o inca de 2 litros'], img: '🍾', isCombo: true },
    { id: 'cp2', name: 'Combo Full Americanas', category: 'Combos Plus', prices: [74.00, 0, 0], ingredients: ['3 pizzas americanas familiares', '1 gaseosa de 2 litros coca/inca'], img: '🚀', isCombo: true },
    { id: 'cp3', name: 'Combo Tú Escoge la 2da', category: 'Combos Plus', prices: [45.00, 0, 0], ingredients: ['1 pizza americana', '1 pizza a elección (hawaiana, peperoni, mixta o granjera)'], img: '⭐', isCombo: true },

    // COMBOS DE PIZZAS COMPARTIDAS (Solo un precio base, usando índice 0)
    { id: 'cc1', name: 'Combo Compartidas 1', category: 'Combos Compartidas', prices: [36.00, 0, 0], ingredients: ['2 pizzas compartidas a escoger (solo clásicas)'], img: '👯', isCombo: true },
    { id: 'cc2', name: 'Combo Compartidas 2', category: 'Combos Compartidas', prices: [42.00, 0, 0], ingredients: ['1 pizza compartida', '1 pizza familiar a escoger (solo clásicas)'], img: '🔀', isCombo: true },

    // ACOMPAÑAMIENTOS (Solo un precio base, usando índice 0)
    { id: 'a1', name: 'Pan al Ajo (Media Porción)', category: 'Acompañamientos', prices: [3.00, 0, 0], ingredients: ['pan con mantequilla de ajo'], img: '🍞', isSide: true },
    { id: 'a2', name: 'Pan al Ajo (1 Porción)', category: 'Acompañamientos', prices: [6.00, 0, 0], ingredients: ['pan con mantequilla de ajo'], img: '🥖', isSide: true },
    { id: 'a3', name: 'Pan al Ajo Especial (Media Porción)', category: 'Acompañamientos', prices: [5.00, 0, 0], ingredients: ['pan con mantequilla de ajo y queso'], img: '🧈', isSide: true },
    { id: 'a4', name: 'Pan al Ajo Especial (1 Porción)', category: 'Acompañamientos', prices: [9.00, 0, 0], ingredients: ['pan con mantequilla de ajo y queso'], img: '🧀🥖', isSide: true },
];

const EXTRAS_DATA: Extra[] = [
    { id: 'e1', name: 'Porción de Queso Extra', price: 6.00 },
    { id: 'e2', name: '1/2 Porción de Queso', price: 3.00 },
    { id: 'e3', name: 'Jamón Extra', price: 3.00 },
    { id: 'e4', name: 'Chorizo Extra', price: 3.00 },
    { id: 'e5', name: 'Peperoni Extra', price: 4.00 },
    { id: 'e6', name: 'Tocino Extra', price: 4.00 },
    { id: 'e7', name: 'Pimentón, Aceituna, Cebolla', price: 1.00, isVegetable: true },
];

// --- NUEVO PRODUCTO PARA PIZZA PERSONALIZADA (MITAD/MITAD) ---
const CUSTOM_PIZZA_ID: string = 'custom-half-half';
const CUSTOM_PIZZA_PRODUCT: BaseProduct = {
    id: CUSTOM_PIZZA_ID,
    name: 'Pizza Personalizada (Mitad/Mitad)',
    category: 'Personalizada',
    prices: [7.00, 14.00, 20.00], // Usaremos estos como precios MINIMOS/BASE
    ingredients: ['Elige tu tamaño y dos sabores de pizza clásica o especial'],
    img: '✨',
    isCustomizable: true,
};

const ALL_PRODUCTS: BaseProduct[] = [...PRODUCT_DATA, CUSTOM_PIZZA_PRODUCT];
const PIZZA_PRODUCTS: BaseProduct[] = PRODUCT_DATA.filter(p => p.category === 'Clásicas' || p.category === 'Especiales');
const ALL_CATEGORIES: Category[] = ['Todas', ...new Set(ALL_PRODUCTS.map(p => p.category))] as Category[];
const PAYMENT_METHODS: string[] = ['Efectivo', 'Yape/Plin', 'PENDIENTE'];

// --- Componente Toast de Notificación ---
const ToastNotification: React.FC<{ message: ToastMessage | null, onDismiss: () => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        if (message) {
            const duration = message.type === 'success' ? 1000 : 3000;
            const timer = setTimeout(onDismiss, duration);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message) return null;

    let icon: React.ReactElement;
    let bgClass: string;
    let textClass: string;

    if (message.type === 'success') {
        icon = <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        bgClass = 'bg-green-600';
        textClass = 'text-white';
    } else if (message.type === 'error') {
        icon = <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
        bgClass = 'bg-red-600';
        textClass = 'text-white';
    } else {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[9999] transition-opacity duration-150 ease-in-out">
            <div className={`flex items-center p-3 rounded-lg shadow-2xl ${bgClass} ${textClass} max-w-xs`}>
                {icon}
                <p className="text-sm font-semibold">{message.text}</p>
            </div>
        </div>
    );
};


// --- Componente principal de la aplicación (App) ---
const App: React.FC = () => {
    // --- Estados de la aplicación (SOLO ESTADO LOCAL) ---
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState<Category>('Todas');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartVisible, setIsCartVisible] = useState<boolean>(false);
    const [message, setMessage] = useState<ToastMessage | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(null); // Producto para personalizar
    const [paymentMethod, setPaymentMethod] = useState<string>(''); // Nuevo estado para el medio de pago
    const [isRegistering, setIsRegistering] = useState<boolean>(false); // Nuevo estado para indicar registro en curso

    // No necesitamos userId ya que no hay persistencia multiusuario con in-memory state
    const userId = "local-user"; 

    // Función para manejar el cierre del toast
    const dismissMessage = useCallback(() => setMessage(null), []);

    // La lógica de Firebase/Auth/Firestore se ha eliminado.
    // El carrito se gestiona completamente en la memoria de la aplicación.
    
    // El useEffect de Firebase ya no es necesario.
    useEffect(() => {
        // En un entorno sin Firebase, el carrito se inicia vacío y se mantiene en el estado de React.
        // Si el usuario hubiera pedido persistencia local (localStorage), se implementaría aquí.
        // Como solo se pidió quitar Firebase, usamos in-memory state.
        console.log("Aplicación inicializada. Usando estado de carrito en memoria.");
    }, []); 

    // --- Lógica de Filtrado (Categoría y Búsqueda) ---
    const filteredProducts: BaseProduct[] = useMemo(() => {
        let result: BaseProduct[] = ALL_PRODUCTS;

        if (activeCategory !== 'Todas') {
            result = result.filter(p => p.category === activeCategory);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lowerCaseSearch) ||
                p.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseSearch))
            );
        }

        return result;
    }, [activeCategory, searchTerm]);

    // --- Manipulación del Carrito (Añadir un ítem ya personalizado) ---
    const handleAddToCart = useCallback(async (customizedItem: Omit<CartItem, 'id' | 'quantity' | 'timestamp'>) => {
    // 1. Crear el nuevo ítem con un ID local y timestamp
        const newItem: CartItem = {
            ...customizedItem,
            id: generateUniqueId(),
            quantity: 1,
            timestamp: new Date(),
        };

        // 2. Actualizar el estado local
        setCartItems(prevItems => [...prevItems, newItem]);

        // 3. Mostrar el toast de éxito
        setMessage({
            type: 'success',
            text: `Añadido: ${newItem.name} (${MONEDA}${newItem.finalPrice.toFixed(2)})`,
        });

        setSelectedProduct(null); // Cerrar modal
    }, []);

    // --- Manipulación del Carrito (Actualizar Cantidad) ---
    const handleUpdateQuantity = (itemId: string, delta: number) => {
        if (isRegistering) return; // Bloquear cambios durante el registro
        
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === itemId) {
                    const newQuantity = (item.quantity || 1) + delta;
                    // Si la nueva cantidad es 0 o menos, el filtro se encargará de eliminarlo
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(item => item.quantity > 0); // Filtra los que tienen cantidad > 0

            // Los items deben estar ordenados por timestamp
            return updatedItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
    };

    // --- Manipulación del Carrito (Eliminar Ítem) ---
    const handleDeleteItem = (itemId: string) => {
        if (isRegistering) return;
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    // --- Lógica de Registro de Orden (Integración Supabase Placeholder con Backoff) ---
    const logOrderToSupabase = async (orderData: Record<string, any>): Promise<{ success: boolean, error?: string, result?: Record<string, any> }> => {
        // <<<<<<<<<<<<<<<<<<<< IMPORTANTE: DEBES CAMBIAR ESTOS VALORES >>>>>>>>>>>>>>>>>>
        const SUPABASE_URL: string = "https://your-supabase-project-url.supabase.co/rest/v1/orders";
        const SUPABASE_API_KEY: string = "YOUR_ANON_KEY"; 
        // <<<<<<<<<<<<<<<<<<<< FIN DE VALORES A CAMBIAR >>>>>>>>>>>>>>>>>>
        
        const MAX_RETRIES: number = 5;

        const performFetch = async (attempt: number): Promise<{ success: boolean, error?: string, result?: Record<string, any> }> => {
            if (SUPABASE_API_KEY === "YOUR_ANON_KEY") {
                 console.log(`[SIMULACIÓN] Pedido listo para enviar a Supabase. Datos:`, orderData);
                 // Simulación de éxito si no se ha configurado la clave
                 await new Promise(resolve => setTimeout(resolve, 300));
                 return { success: true, result: { message: "Simulación exitosa. Configura tu URL y API Key de Supabase." } };
            }

            console.log(`Intentando registrar la orden (Intento ${attempt + 1})...`);
            
            try {
                const response = await fetch(SUPABASE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_API_KEY,
                    },
                    body: JSON.stringify(orderData)
                });

                if (response.ok || response.status === 201) {
                    const result = await response.json().catch(() => ({})); 
                    console.log("Registro de pedido exitoso en Supabase:", result);
                    return { success: true, result };
                } else if (response.status === 429 && attempt < MAX_RETRIES - 1) {
                    throw new Error("Retryable error: Too many requests (429)");
                } else {
                    const errorText = await response.text();
                    console.error(`Error al registrar orden. Estado: ${response.status}`, errorText);
                    return { success: false, error: `HTTP Error ${response.status}: ${errorText.substring(0, 100)}` };
                }
            } catch (error) {
                const err = error as Error;
                if (err.message.includes("Retryable error")) {
                    throw err; 
                }
                console.error("Error de red/fetch:", err.message);
                return { success: false, error: err.message };
            }
        };

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                return await performFetch(attempt);
            } catch (e) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return { success: false, error: "Fallo al conectar con el servidor de Supabase después de múltiples reintentos." };
    };

    // Función que limpia el carrito localmente
    const clearCart = () => {
        setCartItems([]);
    };

    // Función principal de registro
    const handleRegisterOrder = async () => {
        if (cartItems.length === 0 || !paymentMethod || isRegistering) {
            setMessage({ type: 'error', text: '¡Falta seleccionar productos o el medio de pago!' });
            return;
        }

        setIsRegistering(true); 

        const orderData = {
            timestamp: new Date().toISOString(),
            userId: userId, // ID de usuario local simulado
            paymentMethod: paymentMethod,
            totalPrice: totalPrice,
            items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                finalPrice: item.finalPrice,
                customization: {
                    size: item.size,
                    isHalfHalf: item.isHalfHalf,
                    comment: item.comment,
                    extras: item.selectedExtras,
                    pizzaHalf1: item.pizzaHalf1,
                    pizzaHalf2: item.pizzaHalf2,
                }
            }))
        };

        try {
            // 1. Lograr la Orden (Supabase)
            const logResult = await logOrderToSupabase(orderData);

            if (logResult.success) {
                // 2. Limpiar el Carrito (ESTADO LOCAL)
                clearCart();
                setPaymentMethod(''); 
                setMessage({ type: 'success', text: `¡Pedido registrado! Total: ${MONEDA}${totalPrice.toFixed(2)}` });
            } else {
                setMessage({ type: 'error', text: logResult.error || 'Error al registrar el pedido en el servidor. Revise la consola.' });
            }
        } catch (error) {
            console.error("Error al registrar el pedido final:", error);
            setMessage({ type: 'error', text: 'Error fatal al registrar. Revise la consola.' });
        } finally {
            setIsRegistering(false); 
        }
    };


    // --- Cálculos de Totales ---
    const totalItems: number = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const totalPrice: number = cartItems.reduce((acc, item) => acc + item.finalPrice * (item.quantity || 1), 0);

    // Determina si el botón de registro debe estar deshabilitado
    const isRegisterDisabled: boolean = cartItems.length === 0 || !paymentMethod || isRegistering;

    // --- Componente de Tarjeta de Producto ---
    const PizzaCard: React.FC<{ product: BaseProduct }> = ({ product }) => {
        const isPizzaType: boolean = product.category === 'Clásicas' || product.category === 'Especiales';
        const isCustomPizza: boolean = product.id === CUSTOM_PIZZA_ID;

        let priceDisplay: string = 'N/A';
        if (isCustomPizza) {
             priceDisplay = `Personaliza Sabores`;
        } else if (isPizzaType && product.prices.length > 2 && product.prices[2] > 0) {
            priceDisplay = `${MONEDA}${product.prices[2].toFixed(2)}`;
        } else if (product.prices[0] > 0) {
            priceDisplay = `${MONEDA}${product.prices[0].toFixed(2)}`;
        }

        return (
            <div
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.02] overflow-hidden flex flex-col cursor-pointer"
            >
                <div className="p-4 flex flex-col justify-between flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 italic">{product.category}</p>
                        </div>
                        <span className="text-4xl">{product.img}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {product.ingredients[0]}...
                    </p>
                </div>
                <div className="p-4 bg-red-100 flex justify-between items-center border-t border-red-200">
                    <span className={`text-xl font-extrabold ${isCustomPizza ? 'text-red-600 text-sm' : 'text-red-800'}`}>
                        {priceDisplay}
                    </span>
                    <button
                        className="flex items-center space-x-1 bg-red-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-900 transition duration-150 active:scale-95"
                    >
                        <span>Elegir</span>
                    </button>
                </div>
            </div>
        );
    };

    // --- Componente de Fila del Carrito ---
    const CartItemRow: React.FC<{ item: CartItem }> = ({ item }) => {
        const customizationDetail: string | null = item.isHalfHalf
            ? `Mitad: ${item.pizzaHalf1?.name} / ${item.pizzaHalf2?.name}`
            : item.size;

        return (
            <div className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0">
                <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    {customizationDetail && <p className="text-xs text-gray-500 italic">Tamaño: {customizationDetail}</p>}
                    {item.comment && <p className="text-xs text-blue-600 italic mt-0.5">Nota: {item.comment}</p>}

                    {item.selectedExtras?.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                            + Extras: {item.selectedExtras.map(e => `${e.name} (${MONEDA}${e.price.toFixed(2)} x ${e.count})`).join(', ')}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-red-700 border border-red-700 rounded-full hover:bg-red-100 transition text-sm"
                        aria-label="Disminuir cantidad"
                        disabled={isRegistering}
                    >
                        -
                    </button>
                    <span className="w-5 text-center font-bold text-gray-700 text-sm">{item.quantity || 1}</span>
                    <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-white bg-red-800 rounded-full hover:bg-red-900 transition text-sm"
                        aria-label="Aumentar cantidad"
                        disabled={isRegistering}
                    >
                        +
                    </button>
                </div>
                <div className="ml-4 w-16 text-right font-bold text-red-800 flex-shrink-0">
                    {MONEDA}{((item.finalPrice || 0) * (item.quantity || 1)).toFixed(2)}
                </div>
            </div>
        );
    };

    interface ModalProps {
        product: BaseProduct;
        onClose: () => void;
        onAdd: (item: Omit<CartItem, 'id' | 'quantity' | 'timestamp'>) => Promise<void>;
    }

    // --- Componente Modal de Personalización ---
    const CustomizationModal: React.FC<ModalProps> = ({ product, onClose, onAdd }) => {
        const isCustomPizza: boolean = product.id === CUSTOM_PIZZA_ID;
        const isPizzaType: boolean = product.category === 'Clásicas' || product.category === 'Especiales';
        const isPricedPizza: boolean = isPizzaType && product.prices[1] > 0;
        const isSideOrCombo: boolean = !!(product.isSide || product.isCombo);

        const initialSize: PizzaSizeLabel | null = isCustomPizza || isPricedPizza
            ? PIZZA_SIZES.FAMILIAR
            : (product.prices[0] > 0 ? Object.values(PIZZA_SIZES)[0] : null);

        const [size, setSize] = useState<PizzaSizeLabel | null>(initialSize);
        const [isHalfHalf, setIsHalfHalf] = useState<boolean>(isCustomPizza);
        const [pizzaHalf1, setPizzaHalf1] = useState<BaseProduct | null>(PIZZA_PRODUCTS[0] || null);
        const [pizzaHalf2, setPizzaHalf2] = useState<BaseProduct | null>(PIZZA_PRODUCTS[1] || null);
        const [comment, setComment] = useState<string>('');
        const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

        // Combos/Sides no tienen personalización compleja, forzamos el precio único.
        useEffect(() => {
            if (isSideOrCombo) {
                setSize(null);
                setIsHalfHalf(false);
            }
        }, [isSideOrCombo]);

        // Cálculo dinámico del precio final
        const finalPrice: number = useMemo(() => {
            let basePrice: number = 0;

            if (isSideOrCombo) {
                // Combos y Acompañamientos solo tienen un precio (índice 0)
                basePrice = product.prices[0];
            } else if (isCustomPizza) {
                // Pizza personalizada: el precio base es el mayor de las dos mitades, usando el tamaño seleccionado
                const sizeIndex: number = size ? SIZE_MAP[size] : 2; // Default a Familiar
                const price1: number = pizzaHalf1?.prices[sizeIndex] || 0;
                const price2: number = pizzaHalf2?.prices[sizeIndex] || 0;
                basePrice = Math.max(price1, price2);
            } else if (size) {
                // Pizza Clásica/Especial: usa el precio según el tamaño
                const sizeIndex: number = SIZE_MAP[size];
                basePrice = product.prices[sizeIndex] || 0;
            } else {
                // Fallback para productos sin precio o sin tamaño seleccionado
                basePrice = product.prices[0] || 0;
            }

            // Sumar extras
            const extrasTotal: number = selectedExtras.reduce((acc, extra) => acc + (extra.price * (extra.count || 1)), 0);

            return basePrice + extrasTotal;
        }, [product, size, isCustomPizza, isSideOrCombo, selectedExtras, pizzaHalf1, pizzaHalf2]);


        // Validación
        const isAddDisabled: boolean = isCustomPizza && (!size || !pizzaHalf1 || !pizzaHalf2 || pizzaHalf1.id === pizzaHalf2.id);


        const handleExtraToggle = (extra: Extra) => {
            setSelectedExtras(prevExtras => {
                const existingExtra = prevExtras.find(e => e.id === extra.id);
                if (existingExtra) {
                    // Si ya existe, incrementar el conteo
                    return prevExtras.map(e => e.id === extra.id
                        ? { ...e, count: (e.count || 1) + 1 }
                        : e
                    );
                } else {
                    // Si no existe, añadir con count = 1
                    return [...prevExtras, { ...extra, count: 1 }];
                }
            });
        };

        const handleDecreaseExtra = (extraId: string) => {
            setSelectedExtras(prevExtras => {
                const existingExtra = prevExtras.find(e => e.id === extraId);
                if (!existingExtra) return prevExtras;

                const newCount = (existingExtra.count || 1) - 1;

                if (newCount <= 0) {
                    // Eliminar si el conteo llega a 0
                    return prevExtras.filter(e => e.id !== extraId);
                } else {
                    // Decrementar el conteo
                    return prevExtras.map(e => e.id === extraId ? { ...e, count: newCount } : e);
                }
            });
        };

        const handleSave = async () => {
            if (isAddDisabled) return;

            // Preparamos el objeto CartItem. Notar que se omiten ID, quantity y timestamp,
            // que serán añadidos por handleAddToCart
            const itemToAdd: Omit<CartItem, 'id' | 'quantity' | 'timestamp'> = {
                productId: product.id,
                name: product.name,
                category: product.category,
                finalPrice: finalPrice,
                size: size,
                isHalfHalf: isHalfHalf,
                comment: comment.trim(),
                selectedExtras: selectedExtras.filter(e => (e.count || 1) > 0).map(e => ({ ...e, count: e.count || 1 })), // Limpiamos y aseguramos count
                pizzaHalf1: pizzaHalf1 && isHalfHalf ? { id: pizzaHalf1.id, name: pizzaHalf1.name } : null,
                pizzaHalf2: pizzaHalf2 && isHalfHalf ? { id: pizzaHalf2.id, name: pizzaHalf2.name } : null,
            };

            await onAdd(itemToAdd);
        };


        // Renderizado del modal
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-70 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col">
                    {/* Encabezado del Modal */}
                    <div className="sticky top-0 p-4 border-b border-gray-200 bg-white rounded-t-xl z-10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-red-800">
                                {product.img} {product.name}
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-700 transition"
                                aria-label="Cerrar personalización"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 italic">{product.ingredients.join(', ')}</p>
                    </div>

                    {/* Contenido del Modal (Scrollable) */}
                    <div className="p-4 flex-grow overflow-y-auto space-y-6">

                        {/* Selección de Tamaño y Tipo */}
                        {(isPizzaType || isCustomPizza) && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <h3 className="font-bold text-lg text-red-700 mb-2">1. Selecciona el Tamaño</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(PIZZA_SIZES).map(([key, label]) => {
                                        const sizeIndex = SIZE_MAP[label];
                                        if (product.prices[sizeIndex] === 0 && !isCustomPizza) return null; // Ocultar tamaños sin precio
                                        
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setSize(label)}
                                                className={`py-2 px-4 rounded-full font-medium transition duration-150 shadow-md 
                                                    ${size === label ? 'bg-red-800 text-white transform scale-105' : 'bg-white text-gray-700 hover:bg-red-100'}`
                                                }
                                            >
                                                {label} ({MONEDA}{product.prices[sizeIndex]?.toFixed(2) || '---'})
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Opciones Mitad/Mitad */}
                        {isCustomPizza && size && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <h3 className="font-bold text-lg text-blue-700 mb-2">2. Elige tus Mitades</h3>
                                <div className="space-y-3">
                                    {/* Mitad 1 */}
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="pizza1" className="font-medium w-20">Mitad 1:</label>
                                        <select
                                            id="pizza1"
                                            value={pizzaHalf1?.id || ''}
                                            onChange={(e) => setPizzaHalf1(PIZZA_PRODUCTS.find(p => p.id === e.target.value) || null)}
                                            className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {PIZZA_PRODUCTS.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Mitad 2 */}
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="pizza2" className="font-medium w-20">Mitad 2:</label>
                                        <select
                                            id="pizza2"
                                            value={pizzaHalf2?.id || ''}
                                            onChange={(e) => setPizzaHalf2(PIZZA_PRODUCTS.find(p => p.id === e.target.value) || null)}
                                            className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {PIZZA_PRODUCTS.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {pizzaHalf1?.id === pizzaHalf2?.id && (
                                        <p className="text-sm text-red-500">⚠ Las mitades son iguales. Considera pedir el producto completo.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Extras (Opcional, solo para pizzas) */}
                        {isPizzaType && size && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <h3 className="font-bold text-lg text-yellow-700 mb-2">3. Agrega Extras (Adicionales)</h3>
                                <div className="space-y-2">
                                    {EXTRAS_DATA.map(extra => {
                                        const count = selectedExtras.find(e => e.id === extra.id)?.count || 0;
                                        return (
                                            <div key={extra.id} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
                                                <span className="text-gray-800 text-sm font-medium">{extra.name} ({MONEDA}{extra.price.toFixed(2)})</span>
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => handleDecreaseExtra(extra.id)}
                                                        disabled={count === 0}
                                                        className="w-6 h-6 flex items-center justify-center text-yellow-700 border border-yellow-700 rounded-full hover:bg-yellow-100 transition disabled:opacity-50 text-sm"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-5 text-center font-bold text-gray-700 text-sm">{count}</span>
                                                    <button
                                                        onClick={() => handleExtraToggle(extra)}
                                                        className="w-6 h-6 flex items-center justify-center text-white bg-yellow-700 rounded-full hover:bg-yellow-800 transition text-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Comentarios */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-700 mb-2">4. Notas o Comentarios Especiales</h3>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ej: Masa delgada, sin aceitunas, etc."
                                className="w-full border border-gray-300 rounded-lg p-2 h-20 text-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                    </div>

                    {/* Footer del Modal (Resumen de Precio) */}
                    <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-red-100 rounded-b-xl z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-red-800">
                                Total: {MONEDA}{finalPrice.toFixed(2)}
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={isAddDisabled}
                                className="flex items-center space-x-2 bg-red-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-red-900 transition duration-150 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                <span>Añadir al Carrito</span>
                            </button>
                        </div>
                        {isAddDisabled && isCustomPizza && <p className='text-sm text-red-600 mt-2 font-medium'>Por favor, selecciona un tamaño y dos mitades distintas.</p>}
                        {isAddDisabled && !isCustomPizza && <p className='text-sm text-red-600 mt-2 font-medium'>Por favor, selecciona un tamaño para continuar.</p>}
                    </div>
                </div>
            </div>
        );
    };

    // --- Renderizado principal de la App ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans relative">
            <ToastNotification message={message} onDismiss={dismissMessage} />

            {/* Encabezado Fijo con Botón de Carrito */}
            <header className="sticky top-0 z-40 bg-white shadow-md p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-red-800 tracking-tight flex items-center">
                        <span className='mr-2'>🍕</span> Marocchinos Pizza
                    </h1>

                    <button
                        onClick={() => setIsCartVisible(!isCartVisible)}
                        className="relative p-3 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition duration-150 active:scale-95"
                        aria-label="Ver Carrito"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        {totalItems > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-yellow-500 rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Sección de Catálogo */}
            <main className="container mx-auto p-4 lg:p-8">
                {/* Búsqueda y Categorías */}
                <div className="mb-8 space-y-4">
                    <input
                        type="text"
                        placeholder="Busca tu pizza por nombre o ingrediente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-inner focus:ring-red-500 focus:border-red-500 transition"
                    />
                    
                    <div className="flex flex-wrap gap-2 lg:gap-3">
                        {ALL_CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`py-2 px-4 rounded-full text-sm font-semibold transition duration-150 shadow-md 
                                    ${activeCategory === category ? 'bg-red-800 text-white' : 'bg-white text-gray-700 hover:bg-red-100 border border-gray-300'}`
                                }
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de Productos */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                        Menú de {activeCategory}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <PizzaCard key={product.id} product={product} />
                            ))
                        ) : (
                            <p className="text-gray-500 col-span-full">No se encontraron productos.</p>
                        )}
                    </div>
                </section>
            </main>

            {/* Modal de Personalización */}
            {selectedProduct && (
                <CustomizationModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAdd={handleAddToCart}
                />
            )}

            {/* Carrito Flotante (Sidebar) */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[380px] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isCartVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Encabezado del Carrito */}
                    <div className="p-4 border-b border-red-200 bg-red-800 text-white flex justify-between items-center">
                        <h2 className="text-xl font-bold">🛒 Tu Pedido ({totalItems} items)</h2>
                        <button onClick={() => setIsCartVisible(false)} className="p-1 rounded-full hover:bg-red-700 transition" aria-label="Cerrar carrito">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Lista de Items del Carrito */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {cartItems.length > 0 ? (
                            cartItems.map(item => (
                                <CartItemRow key={item.id} item={item as CartItem} />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <span className="text-4xl block mb-2">🤷‍♂️</span>
                                <p>Tu carrito está vacío.</p>
                            </div>
                        )}
                    </div>

                    {/* Pie de Carrito (Totales y Pago) */}
                    <div className="p-4 border-t border-gray-200 bg-red-50">
                        {/* Selector de Pago */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full p-2 border border-red-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500"
                                disabled={isRegistering || cartItems.length === 0}
                            >
                                <option value="">Selecciona un método...</option>
                                {PAYMENT_METHODS.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>

                        {/* Total y Botón de Orden */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-extrabold text-red-800">TOTAL:</span>
                            <span className="text-3xl font-extrabold text-red-800">{MONEDA}{totalPrice.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleRegisterOrder}
                            disabled={isRegisterDisabled}
                            className="w-full py-3 bg-green-600 text-white font-bold text-lg rounded-xl shadow-xl hover:bg-green-700 transition duration-150 active:scale-[0.98] disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isRegistering ? (
                                <div className="flex items-center space-x-2">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registrando pedido...
                                </div>
                            ) : (
                                <>
                                    <span className='mr-2'>✅</span>
                                    <span>Registrar Pedido</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
