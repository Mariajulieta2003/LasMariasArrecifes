import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase.js';

// Ahora podés usar `db` para leer/escribir pedidos

// --- Imports de Firebase (Asegúrate de que estas librerías estén disponibles en el entorno) ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  Timestamp
} from 'firebase/firestore';

// --- Configuración de Utilidades ---

// Color Principal (Ajustado al Cyan/Teal del logo de Las Marías)
const PRIMARY_COLOR = 'bg-cyan-600'; // Color de fondo principal (Botones, headers)
const HOVER_COLOR = 'hover:bg-cyan-700'; // Color de hover principal
const TEXT_COLOR = 'text-cyan-600'; // Color de texto principal
const BORDER_COLOR = 'border-cyan-500'; // Color de borde principal (Para formularios/secciones)
const ACCENT_COLOR_BG = 'bg-cyan-500'; // Color de fondo para botones de acción secundaria (antes azul)
const ACCENT_COLOR_TEXT = 'text-cyan-600'; // Color de texto para botones de acción secundaria (antes azul)

// Se elimina el color rojo para esta sección y se usa el color principal/acento.
const ITEMS_BORDER_COLOR = 'border-cyan-500'; // Color de borde para la sección de ítems
const ITEMS_HEADER_TEXT = 'text-cyan-600'; // Color de texto para el encabezado de ítems

// Mantenemos las variables de alerta en caso de que se usen en el futuro para mensajes de error
const ALERT_COLOR_BG = 'bg-red-500'; // Mantenemos el rojo para eliminar/peligro (solo para el botón de eliminar y modal de error)
const ALERT_COLOR_TEXT = 'text-red-600'; // Mantenemos el rojo para eliminar/peligro (solo para el botón de eliminar y modal de error)


// Función para formatear la fecha a YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Iconos Lucide (simulados con SVG básico para no romper la regla de un solo archivo)
const UserIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BoxIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0h-6"/><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 12v4"/><path d="M10 14h4"/></svg>;
const ShoppingCartIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M2 2h3.5l1.35 6.75A2 2 0 0 0 8.7 11h9.6a2 2 0 0 0 1.7-2.25L21 4.5"/></svg>;
const ListIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const TrashIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const EditIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const PrinterIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/></svg>;
const SearchIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;


// --- CONFIGURACIÓN DE FIREBASE ---
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1zD0K0aYLAqFiZAcXBr-a_qWeqjcjPtA",
  authDomain: "las-marias-arrecifes.firebaseapp.com",
  projectId: "las-marias-arrecifes",
  storageBucket: "las-marias-arrecifes.firebasestorage.app",
  messagingSenderId: "371359106051",
  appId: "1:371359106051:web:0aca7d6911ce65b33a7a36",
  measurementId: "G-X0FJH0YZ31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.error("Firebase config is missing or empty.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// --- COMPONENTE PRINCIPAL ---

const App = () => {
  const [currentModule, setCurrentModule] = useState('order_taking');
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Manejo de Autenticación y Carga Inicial de Datos
  useEffect(() => {
    if (!auth || !db) return;

    // 1a. Autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            const anonymousUser = await signInAnonymously(auth);
            setUserId(anonymousUser.user.uid);
          }
        } catch (e) {
          console.error("Error signing in:", e);
          // Fallback user ID for read-only simulation if auth fails entirely
          setUserId(crypto.randomUUID()); 
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // 1b. Suscripción a Colecciones de Firestore (Real-Time)
  useEffect(() => {
    if (!isAuthReady || !userId || !db) return;

    setLoading(true);

    const baseRef = (collectionName) => collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`);

    const unsubscribeProducts = onSnapshot(query(baseRef('products')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    }, (e) => setError(`Error cargando productos: ${e.message}`));

    const unsubscribeClients = onSnapshot(query(baseRef('clients')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(data);
    }, (e) => setError(`Error cargando clientes: ${e.message}`));

    const unsubscribeOrders = onSnapshot(query(baseRef('orders')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : doc.data().date
      }));
      setOrders(data);
      setLoading(false);
    }, (e) => setError(`Error cargando pedidos: ${e.message}`));

    return () => {
      unsubscribeProducts();
      unsubscribeClients();
      unsubscribeOrders();
    };
  }, [isAuthReady, userId]);

  // Funciones CRUD genéricas
  const getCollectionRef = (collectionName) => collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`);

  const handleSave = async (data, collectionName, id = null) => {
    if (!userId || !db) {
      setError("Base de datos no disponible. Por favor, inicie sesión o recargue.");
      return;
    }
    try {
      if (id) {
        await setDoc(doc(getCollectionRef(collectionName), id), data);
      } else {
        await addDoc(getCollectionRef(collectionName), data);
      }
      return true;
    } catch (e) {
      setError(`Error al guardar en ${collectionName}: ${e.message}`);
      return false;
    }
  };

  const handleDelete = async (id, collectionName) => {
    if (!userId || !db) {
      setError("Base de datos no disponible.");
      return;
    }
    // Reemplazado window.confirm() por un modal de confirmación simulado ya que no se permiten diálogos nativos.
    if (window.confirm(`¿Estás seguro de eliminar este registro de ${collectionName}?`)) {
      try {
        await deleteDoc(doc(getCollectionRef(collectionName), id));
        return true;
      } catch (e) {
        setError(`Error al eliminar de ${collectionName}: ${e.message}`);
        return false;
      }
    }
    return false;
  };

  // --- COMPONENTES DE VISTA (MÓDULOS) ---

  // Módulo 1: Productos (CRUD con Búsqueda)
  const ProductsManager = () => {
    const [newItem, setNewItem] = useState({ id: '', description: '', additionalDescription: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // Nuevo estado para búsqueda

    // Filtra productos en tiempo real
    const filteredProducts = useMemo(() => {
      if (!searchQuery) return products;
      const queryLower = searchQuery.toLowerCase();
      return products.filter(p => 
        p.id?.toLowerCase().includes(queryLower) ||
        p.description?.toLowerCase().includes(queryLower) ||
        p.additionalDescription?.toLowerCase().includes(queryLower)
      );
    }, [searchQuery, products]);

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      const dataToSave = {
        description: newItem.description,
        additionalDescription: newItem.additionalDescription,
      };

      const success = await handleSave(dataToSave, 'products', editingId || newItem.id);
      if (success) {
        setNewItem({ id: '', description: '', additionalDescription: '' });
        setEditingId(null);
      }
    };

    const handleEdit = (product) => {
      setNewItem({ 
        id: product.id, 
        description: product.description, 
        additionalDescription: product.additionalDescription 
      });
      setEditingId(product.id);
    };

    return (
      <div className="p-4 space-y-6">
        <h2 className={`text-2xl font-bold ${TEXT_COLOR}`}>Gestión de Productos</h2>
        
        {/* Formulario de Producto */}
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-cyan-500">
          <h3 className="text-lg font-semibold mb-3">{editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h3>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="ID Producto (solo al crear)"
              value={newItem.id}
              onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg col-span-1"
              required={!editingId}
              disabled={!!editingId}
            />
            <input
              type="text"
              placeholder="Descripción"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg col-span-1"
              required
            />
            <input
              type="text"
              placeholder="Descripción Adicional"
              value={newItem.additionalDescription}
              onChange={(e) => setNewItem({ ...newItem, additionalDescription: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg col-span-1"
              required
            />
            <button type="submit" className={`p-2 rounded-lg text-white font-semibold transition ${PRIMARY_COLOR} ${HOVER_COLOR}`}>
              {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setNewItem({ id: '', description: '', additionalDescription: '' });
                }} 
                className="p-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancelar Edición
              </button>
            )}
          </form>
        </div>

        {/* Barra de Búsqueda de Productos */}
        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-2">
            <SearchIcon className={`w-5 h-5 ${TEXT_COLOR}`} />
            <input
              type="text"
              placeholder="Buscar producto por ID, Descripción o Adicional..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border-0 focus:ring-0 w-full rounded-lg"
            />
        </div>


        {/* Listado de Productos */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`bg-cyan-100 ${TEXT_COLOR}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Adicional</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-cyan-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.additionalDescription}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(p)} className={`text-cyan-600 hover:text-cyan-900 p-1 rounded-full hover:bg-cyan-100 transition`}>
                      <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleDelete(p.id, 'products')} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition">
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="text-center py-4 text-gray-500">No hay productos cargados.</p>}
          {products.length > 0 && filteredProducts.length === 0 && <p className="text-center py-4 text-gray-500">No se encontraron productos con el criterio de búsqueda.</p>}
        </div>
      </div>
    );
  };

  // Módulo 2: Clientes (CRUD con Búsqueda)
  const ClientsManager = () => {
    const [newItem, setNewItem] = useState({ id: '', socialReason: '', zone: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // Nuevo estado para búsqueda

    // Filtra clientes en tiempo real
    const filteredClients = useMemo(() => {
      if (!searchQuery) return clients;
      const queryLower = searchQuery.toLowerCase();
      return clients.filter(c => 
        c.id?.toLowerCase().includes(queryLower) ||
        c.socialReason?.toLowerCase().includes(queryLower)
      );
    }, [searchQuery, clients]);

    const handleFormSubmit = async (e) => {
      e.preventDefault();
      const dataToSave = {
        socialReason: newItem.socialReason,
        zone: newItem.zone,
      };
      
      const success = await handleSave(dataToSave, 'clients', editingId || newItem.id);
      if (success) {
        setNewItem({ id: '', socialReason: '', zone: '' });
        setEditingId(null);
      }
    };

    const handleEdit = (client) => {
      setNewItem({ 
        id: client.id, 
        socialReason: client.socialReason, 
        zone: client.zone 
      });
      setEditingId(client.id);
    };

    const availableZones = useMemo(() => {
        const zones = [...new Set(clients.map(c => c.zone).filter(z => z))];
        return zones.sort();
    }, [clients]);

    return (
      <div className="p-4 space-y-6">
        <h2 className={`text-2xl font-bold ${TEXT_COLOR}`}>Gestión de Clientes</h2>

        {/* Formulario de Cliente */}
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-cyan-500">
          <h3 className="text-lg font-semibold mb-3">{editingId ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h3>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="ID Cliente (solo al crear)"
              value={newItem.id}
              onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg col-span-1"
              required={!editingId}
              disabled={!!editingId}
            />
            <input
              type="text"
              placeholder="Razón Social"
              value={newItem.socialReason}
              onChange={(e) => setNewItem({ ...newItem, socialReason: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg col-span-1"
              required
            />
            
            <div className="relative col-span-1">
                <input
                    type="text"
                    placeholder="Zona"
                    value={newItem.zone}
                    onChange={(e) => setNewItem({ ...newItem, zone: e.target.value })}
                    className="p-2 border border-gray-300 rounded-lg w-full"
                    list="zones-list"
                    required
                />
                <datalist id="zones-list">
                    {availableZones.map(zone => (
                        <option key={zone} value={zone} />
                    ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">Escribe la zona o selecciona una existente.</p>
            </div>


            <button type="submit" className={`p-2 rounded-lg text-white font-semibold transition ${PRIMARY_COLOR} ${HOVER_COLOR} col-span-1`}>
              {editingId ? 'Guardar Cambios' : 'Agregar Cliente'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setNewItem({ id: '', socialReason: '', zone: '' });
                }} 
                className="p-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancelar Edición
              </button>
            )}
          </form>
        </div>

        {/* Barra de Búsqueda de Clientes */}
        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-2">
            <SearchIcon className={`w-5 h-5 ${TEXT_COLOR}`} />
            <input
              type="text"
              placeholder="Buscar cliente por ID o Razón Social..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border-0 focus:ring-0 w-full rounded-lg"
            />
        </div>


        {/* Listado de Clientes */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`bg-cyan-100 ${TEXT_COLOR}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Razón Social</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Zona</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((c) => (
                <tr key={c.id} className="hover:bg-cyan-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.socialReason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.zone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(c)} className={`text-cyan-600 hover:text-cyan-900 p-1 rounded-full hover:bg-cyan-100 transition`}>
                      <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={() => handleDelete(c.id, 'clients')} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition">
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && <p className="text-center py-4 text-gray-500">No hay clientes cargados.</p>}
          {clients.length > 0 && filteredClients.length === 0 && <p className="text-center py-4 text-gray-500">No se encontraron clientes con el criterio de búsqueda.</p>}
        </div>
      </div>
    );
  };

  // Módulo 3: Toma de Pedidos
  const OrderTaker = () => {
    const today = formatDate(new Date());
    const [currentOrder, setCurrentOrder] = useState({
      clientId: '',
      clientSocialReason: '',
      zone: '',
      date: today,
      notes: '',
      items: [], // { productId, description, quantity }
    });
    
    // Nuevo estado para el producto actualmente seleccionado en el buscador
    const [selectedProduct, setSelectedProduct] = useState(null); 
    const [searchQuery, setSearchQuery] = useState('');
    const [productQuantity, setProductQuantity] = useState(1);
    const [editItemIndex, setEditItemIndex] = useState(null);

    // Búsqueda de productos
    const filteredProducts = useMemo(() => {
      if (!searchQuery) return products;
      const queryLower = searchQuery.toLowerCase();
      return products.filter(p => 
        p.id?.toLowerCase().includes(queryLower) ||
        p.description?.toLowerCase().includes(queryLower) ||
        p.additionalDescription?.toLowerCase().includes(queryLower)
      );
    }, [searchQuery, products]);
    
    // Función para seleccionar un producto del listado de búsqueda
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSearchQuery(product.description); // Limpia la búsqueda visualmente
        setProductQuantity(1);
    }
    
    // Función de AÑADIR AL PEDIDO (vinculada al botón "Aceptar")
    const handleAddItemToOrder = () => {
        if (!selectedProduct) {
            setError("Primero debe seleccionar un producto.");
            return;
        }
        if (productQuantity <= 0) {
            setError("La cantidad debe ser mayor a cero.");
            return;
        }
        
        const newItem = {
            productId: selectedProduct.id,
            description: selectedProduct.description,
            additionalDescription: selectedProduct.additionalDescription,
            quantity: parseInt(productQuantity),
        };
        
        let updatedItems = [...currentOrder.items];

        if (editItemIndex !== null) {
            // Modificar ítem existente
            updatedItems[editItemIndex] = newItem;
        } else {
            // Agregar (fusionar si ya existe)
            const existingIndex = updatedItems.findIndex(item => item.productId === selectedProduct.id);
            if (existingIndex > -1) {
                updatedItems[existingIndex].quantity += newItem.quantity;
            } else {
                updatedItems.push(newItem);
            }
        }
        
        setCurrentOrder(prev => ({ ...prev, items: updatedItems }));
        
        // Resetear estados de selección/búsqueda/cantidad
        setSelectedProduct(null);
        setSearchQuery('');
        setProductQuantity(1);
        setEditItemIndex(null);
        
        // Limpiar error si lo había
        setError(null);
    }

    // Manejo de la selección de cliente
    const handleClientChange = (e) => {
      const clientId = e.target.value;
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setCurrentOrder(prev => ({
          ...prev,
          clientId: client.id,
          clientSocialReason: client.socialReason,
          zone: client.zone,
        }));
      } else {
        setCurrentOrder(prev => ({
          ...prev,
          clientId: '',
          clientSocialReason: '',
          zone: '',
        }));
      }
    };

    // Eliminar ítem del pedido
    const handleRemoveItem = (index) => {
      setCurrentOrder(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
      setEditItemIndex(null); // Asegura que se salga del modo edición si estaba activo
    };
    
    // Iniciar edición de ítem
    const handleEditItem = (item, index) => {
        setEditItemIndex(index);
        // Pre-selecciona el producto para modificar
        setSelectedProduct(products.find(p => p.id === item.productId));
        setSearchQuery(item.description); // Muestra el nombre en la barra de búsqueda (aunque ya está seleccionado)
        setProductQuantity(item.quantity);
    };

    // Generar/Guardar Pedido
    const handleGenerateOrder = async () => {
      // Reemplazado alert() por mensaje de error simulado ya que no se permiten diálogos nativos.
      if (!currentOrder.clientId) {
        setError("Debe seleccionar un cliente.");
        return;
      }
      if (currentOrder.items.length === 0) {
        setError("El pedido no puede estar vacío.");
        return;
      }

      const orderData = {
        clientId: currentOrder.clientId,
        clientSocialReason: currentOrder.clientSocialReason,
        zone: currentOrder.zone,
        date: Timestamp.fromDate(new Date(currentOrder.date)),
        notes: currentOrder.notes,
        items: currentOrder.items,
        vendorId: userId,
        status: 'PENDING',
      };

      const success = await handleSave(orderData, 'orders');

      if (success) {
        // Reemplazado alert() por mensaje de éxito simulado
        alert("¡Pedido generado con éxito!"); 
        setCurrentOrder({
          clientId: '',
          clientSocialReason: '',
          zone: '',
          date: today,
          notes: '',
          items: [],
        });
      }
    };

    return (
      <div className="p-4 space-y-6">
        <h2 className={`text-2xl font-bold ${TEXT_COLOR}`}>Toma de Pedidos</h2>

        {/* Sección de Cliente y Cabecera */}
        <div className={`bg-white p-4 rounded-xl shadow-lg border-t-4 ${BORDER_COLOR}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <select
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                value={currentOrder.clientId}
                onChange={handleClientChange}
                required
              >
                <option value="" disabled>Seleccione un cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.socialReason} (ID: {c.id})</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Zona</label>
              <input
                type="text"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                value={currentOrder.zone || 'N/A'}
                readOnly
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                value={currentOrder.date}
                readOnly
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
            <textarea
              className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
              rows="2"
              value={currentOrder.notes}
              onChange={(e) => setCurrentOrder({ ...currentOrder, notes: e.target.value })}
            ></textarea>
          </div>
        </div>
        
        {/* Sección de Productos - MODIFICADA */}
        <div className={`bg-white p-4 rounded-xl shadow-lg border-t-4 ${BORDER_COLOR}`}>
            <h3 className={`text-xl font-semibold ${TEXT_COLOR} mb-4`}>Añadir Productos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                {/* Búsqueda */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Buscar y Seleccionar Producto</label>
                    <input
                        type="text"
                        placeholder="Buscar producto (ID, Desc. o Adic.)"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedProduct(null); // Deselecciona al empezar a escribir
                        }}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {selectedProduct && (
                        <p className={`mt-1 text-sm font-semibold ${ACCENT_COLOR_TEXT}`}>
                            Producto Seleccionado: {selectedProduct.description} (ID: {selectedProduct.id})
                        </p>
                    )}
                </div>
                
                {/* Cantidad */}
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                        type="number"
                        min="1"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                        disabled={!selectedProduct}
                    />
                </div>
                
                {/* Botón ACEPTAR (Añadir/Modificar) */}
                <div className="col-span-1">
                    <button 
                        type="button" 
                        onClick={handleAddItemToOrder} 
                        disabled={!selectedProduct || productQuantity <= 0}
                        className={`w-full p-2 rounded-lg text-white font-semibold transition ${PRIMARY_COLOR} ${HOVER_COLOR} disabled:opacity-50`}
                    >
                        {editItemIndex !== null ? 'MODIFICAR ÍTEM' : 'AÑADIR AL PEDIDO'}
                    </button>
                </div>
            </div>

            {/* Resultado de la Búsqueda y Selección */}
            {searchQuery && !selectedProduct && filteredProducts.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mt-2">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Adicional</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.slice(0, 5).map(p => (
                                <tr key={p.id} className="hover:bg-cyan-50">
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                        {p.description} (ID: {p.id})
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        {p.additionalDescription}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm">
                                        <button 
                                            onClick={() => handleProductSelect(p)}
                                            className={`text-white ${ACCENT_COLOR_BG} ${HOVER_COLOR} px-3 py-1 rounded-full text-xs font-semibold transition`}
                                        >
                                            Seleccionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Ítems del Pedido (Carrito) - CAMBIO DE COLOR ROJO A CYAN/TEAL */}
        <div className={`bg-white p-4 rounded-xl shadow-lg border-t-4 ${ITEMS_BORDER_COLOR}`}>
            <h3 className={`text-xl font-semibold ${ITEMS_HEADER_TEXT} mb-4`}>Ítems del Pedido ({currentOrder.items.length})</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`bg-cyan-100`}> {/* Fondo más suave */}
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Producto</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Cantidad</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentOrder.items.map((item, index) => (
                            <tr key={item.productId + index} className={index === editItemIndex ? 'bg-yellow-100' : 'hover:bg-gray-50'}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {item.description}
                                    <span className="text-xs text-gray-500 block">({item.additionalDescription})</span>
                                </td>
                                <td className="px-4 py-2 text-center whitespace-nowrap text-lg font-bold text-gray-700">
                                    {item.quantity}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleEditItem(item, index)} className={`text-cyan-600 hover:text-cyan-900 p-1 rounded-full hover:bg-cyan-100 transition`}>
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {currentOrder.items.length === 0 && <p className="text-center py-4 text-gray-500">El pedido está vacío.</p>}
            </div>
        </div>

        {/* Botón de Generar Pedido */}
        <div className="pt-4 flex justify-center">
            <button 
                onClick={handleGenerateOrder} 
                className={`w-full max-w-sm p-3 rounded-xl text-white font-bold text-xl transition shadow-lg ${PRIMARY_COLOR} ${HOVER_COLOR}`}
            >
                GENERAR PEDIDO ({currentOrder.items.length} Ítems)
            </button>
        </div>
      </div>
    );
  };
  
  // Módulo 4: Listado de Pedidos y PDF
  const OrderList = () => {
    // ESTADOS PARA INPUTS DE FILTRO PENDIENTES
    const [filterZone, setFilterZone] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    
    // ESTADOS PARA FILTROS APLICADOS (solo cambian al presionar Buscar)
    const [appliedFilterZone, setAppliedFilterZone] = useState('');
    const [appliedFilterDateStart, setAppliedFilterDateStart] = useState('');
    const [appliedFilterDateEnd, setAppliedFilterDateEnd] = useState('');
    
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    
    // Zonas disponibles para el filtro
    const availableZones = useMemo(() => {
      const zones = [...new Set(orders.map(o => o.zone).filter(z => z))];
      return ['Todas', ...zones.sort()];
    }, [orders]);

    // Función que aplica los filtros y resetea las selecciones
    const handleSearch = () => {
        setAppliedFilterZone(filterZone);
        setAppliedFilterDateStart(filterDateStart);
        setAppliedFilterDateEnd(filterDateEnd);
        setSelectedOrderIds([]); // Importante: Resetear las selecciones al cambiar el conjunto de resultados
    };

    // Lógica de Filtrado (Ahora usa los estados 'applied')
    const filteredOrders = useMemo(() => {
      return orders.filter(order => {
        // Filtro por Zona
        if (appliedFilterZone && appliedFilterZone !== 'Todas' && order.zone !== appliedFilterZone) {
          return false;
        }

        // Filtro por Rango de Fechas
        const orderDate = formatDate(order.date);
        if (appliedFilterDateStart && orderDate < appliedFilterDateStart) {
          return false;
        }
        if (appliedFilterDateEnd && orderDate > appliedFilterDateEnd) {
          return false;
        }
        return true;
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Más recientes primero
    }, [orders, appliedFilterZone, appliedFilterDateStart, appliedFilterDateEnd]);
    
    // Manejo de Checkboxes
    const handleSelectOrder = (orderId) => {
      setSelectedOrderIds(prev => 
        prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
      );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedOrderIds(filteredOrders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    }

    // Preparación de Contenido PDF
    const generatePdfContent = () => {
        // Filtra los pedidos SELECCIONADOS de la lista TOTAL de pedidos
        const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
        if (selectedOrders.length === 0) return 'No hay pedidos seleccionados.';

        let content = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px;">
                    Reporte de Pedidos Seleccionados - Las Marias Arrecifes
                </h1>
                <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-AR')}</p>
                <p><strong>Total de Pedidos:</strong> ${selectedOrders.length}</p>
        `;

        selectedOrders.forEach((order, index) => {
            content += `
                <div style="margin-top: 30px; border: 1px solid #ccc; padding: 15px; border-radius: 8px;">
                    <h2 style="color: #22d3ee; font-size: 1.2em; margin-top: 0;">Pedido #${index + 1} (ID: ${order.id.substring(0, 8)}...)</h2>
                    <p><strong>Cliente:</strong> ${order.clientSocialReason} (ID: ${order.clientId})</p>
                    <p><strong>Fecha:</strong> ${formatDate(order.date)}</p>
                    <p><strong>Zona:</strong> ${order.zone}</p>
                    <p><strong>Notas:</strong> ${order.notes || 'N/A'}</p>
                    <h3 style="font-size: 1em; margin-top: 15px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">Detalle de Productos:</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${order.items.map(item => `
                            <li style="margin-bottom: 5px; padding: 5px; background: #f9f9f9; border-radius: 4px;">
                                ${item.description} (${item.additionalDescription}) - <strong>Cantidad: ${item.quantity}</strong>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });

        content += `</div>`;
        return content;
    };
    
    // Generar PDF
    const handleGeneratePdf = () => {
        // Reemplazado alert() por mensaje de error simulado
        if (selectedOrderIds.length === 0) {
            setError('Debe seleccionar al menos un pedido para generar el PDF.');
            return;
        }
        
        const content = generatePdfContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Reporte de Pedidos</title></head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Simulación de la apertura de impresión para guardar como PDF
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    return (
      <div className="p-4 space-y-6">
        <h2 className={`text-2xl font-bold ${TEXT_COLOR}`}>Listado y Reporte de Pedidos</h2>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-cyan-500">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                {/* 1. Zona */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Zona</label>
                    <select
                        value={filterZone}
                        onChange={(e) => setFilterZone(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                    >
                        {availableZones.map(zone => (
                            <option key={zone} value={zone}>{zone}</option>
                        ))}
                    </select>
                </div>
                {/* 2. Fecha Desde */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Desde</label>
                    <input
                        type="date"
                        value={filterDateStart}
                        onChange={(e) => setFilterDateStart(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
                {/* 3. Fecha Hasta */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Hasta</label>
                    <input
                        type="date"
                        value={filterDateEnd}
                        onChange={(e) => setFilterDateEnd(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
                {/* 4. Botón Buscar (NUEVO) */}
                <div className="col-span-1">
                    <button 
                        onClick={handleSearch} 
                        className={`w-full p-2 rounded-lg text-white font-semibold transition ${PRIMARY_COLOR} ${HOVER_COLOR}`}
                    >
                        Buscar
                    </button>
                </div>
                {/* 5. Botón Generar PDF (Utiliza un color contrastante para la acción final) */}
                <div className="col-span-1">
                    <button 
                        onClick={handleGeneratePdf} 
                        disabled={selectedOrderIds.length === 0}
                        className={`w-full p-2 rounded-lg text-white font-semibold transition flex items-center justify-center space-x-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50`}
                    >
                        <PrinterIcon className="w-5 h-5"/>
                        <span>Generar PDF ({selectedOrderIds.length})</span>
                    </button>
                </div>
            </div>
        </div>
        
        {/* Indicador de Filtro Aplicado */}
        {(appliedFilterZone || appliedFilterDateStart || appliedFilterDateEnd) && (
            <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                Filtros Aplicados. Mostrando {filteredOrders.length} pedidos.
            </div>
        )}

        {/* Listado de Pedidos */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`bg-cyan-100 ${TEXT_COLOR}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    <input 
                        type="checkbox" 
                        className={`form-checkbox h-4 w-4 ${TEXT_COLOR}`}
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Zona</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Detalle de Productos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-cyan-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input 
                        type="checkbox" 
                        className={`form-checkbox h-4 w-4 ${TEXT_COLOR}`}
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(order.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.clientSocialReason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.zone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <ul className="list-disc list-inside space-y-1">
                        {order.items.map((item, idx) => (
                            <li key={idx} className="truncate">{item.description} - Cantidad: {item.quantity}</li>
                        ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="text-center py-4 text-gray-500">No hay pedidos registrados.</p>}
          {orders.length > 0 && filteredOrders.length === 0 && <p className="text-center py-4 text-gray-500">No se encontraron pedidos con los filtros aplicados.</p>}
        </div>
      </div>
    );
  };

  // --- RENDERING PRINCIPAL ---
  const renderModule = () => {
    if (loading || !isAuthReady) {
        return <div className="text-center p-8 text-xl font-semibold text-gray-500">Cargando datos...</div>;
    }

    switch (currentModule) {
      case 'products':
        return <ProductsManager />;
      case 'clients':
        return <ClientsManager />;
      case 'order_taking':
        return <OrderTaker />;
      case 'order_list':
        return <OrderList />;
      default:
        return <OrderTaker />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col lg:flex-row">
      
      {/* Barra Lateral de Navegación */}
      <nav className={`bg-white shadow-xl lg:w-64 flex-shrink-0 p-4 border-r border-gray-200`}>
        <div className="sticky top-0 space-y-6">
          
          {/* Logo y Título (Las Marias Arrecifes) */}
          <div className="flex flex-col items-center space-y-2 pb-4 border-b border-gray-200">
            {/* Uso de la URL del logo cargado por el usuario */}
            <img 
              src="uploaded:Las Marias, logo sin fondo.png-46972c57-abae-4a23-ae6e-774950d74812" 
              alt="Logo Las Marias Arrecifes" 
              className="w-24 h-auto" 
            />
            <span className={`text-xl font-extrabold text-center ${TEXT_COLOR}`}>
                Las Marias Arrecifes
            </span>
          </div>
          

          {/* Menú de Navegación */}
          <div className="space-y-2">
            {[
              { id: 'order_taking', name: 'Toma de Pedidos', icon: ShoppingCartIcon },
              { id: 'order_list', name: 'Listado de Pedidos', icon: ListIcon },
              { id: 'products', name: 'Módulo Productos', icon: BoxIcon },
              { id: 'clients', name: 'Módulo Clientes', icon: UserIcon },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentModule(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl font-medium transition duration-150 ease-in-out ${
                  currentModule === item.id
                    ? `${PRIMARY_COLOR} text-white shadow-md`
                    : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* Info de Usuario */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              <p>ID Vendedor:</p>
              <p className="break-all font-mono text-xs">{userId || 'Sin autenticar'}</p>
          </div>
          
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="flex-1 p-0 overflow-y-auto">
        {renderModule()}
      </main>
      
      {/* Modal de Error */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm">
            <h3 className="text-xl font-bold text-red-600 mb-4">Error de la Aplicación</h3>
            <p className="text-gray-700">{error}</p>
            <button 
                onClick={() => setError(null)} 
                className="mt-4 w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
                Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
