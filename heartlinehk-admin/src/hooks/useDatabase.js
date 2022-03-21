import { getDatabase, ref, off, onValue, DatabaseReference, Database } from "firebase/database";
import { getAuth } from "firebase/auth";
import { useEffect, useReducer, useState } from "react";

// Constants for sorting orders
export const SORT_ORDERS = {
    ASCENDING: 'ascending',
    DESCENDING: 'descending',
    NO_SORTING: 'no-sorting'
}

// Constants for database reducer actions
const REDUCER_ACTIONS = {
    ERROR: 'error',
    ON_VALUE: 'on-value',
}

// Constant for database reducer initial state
const initialState = {
    loading: true,
    error: null,
    values: null
}

const databaseReducer = (state, action)=>{
    switch(action.type){
        case REDUCER_ACTIONS.ERROR:
            return {
                ...state,
                loading: false,
                error: action.payload.error,
                values: null
            };
        case REDUCER_ACTIONS.ON_VALUE:
            return {
                ...state,
                loading: false,
                error: null,
                values: action.payload.data
            }
        default:
            throw new Error("Unknown Reducer Action!");    
    };

};

/**
 * Firebase Realtime Database Custom Hook. 
 * @param {string} refPath - Database Reference Path.
 * @returns {DatabaseReference} databaseRef - Database Reference of the given path.
 * @returns {boolean} loading - Flag indicating if the hook is loading.
 * @returns {(string | null)} error - Error message.
 * @returns {(any | null)} values - Value stored in the given path.  
 */
export function useDatabase(refPath){

    const database = getDatabase();
    const auth = getAuth();

    const [state, dispatch] = useReducer(databaseReducer, initialState);
    //const [databaseRefPath, setDatabaseRefPath] = useState(null);
    const [databaseRef, setDatabaseRef] = useState(null);

    const onValueHandler = (snapshot)=>{
        dispatch({type: REDUCER_ACTIONS.ON_VALUE, payload: {data: snapshot.val()}});
    };

    const onValueErrorHandler = (error)=>{
        dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
    };

    useEffect(()=>{
        //Check if the database object is valid or not
        if (database){
            const tmpRefPath = (typeof refPath === 'string'?refPath:'/');
            const newDatabaseRef = ref(database, tmpRefPath);

            //Detach listeners if the database reference has updated
            if (databaseRef != null) off(databaseRef, 'value');

            //Listen for onValue event at the database reference
            setDatabaseRef(newDatabaseRef);
            onValue(newDatabaseRef, onValueHandler, onValueErrorHandler);

        }else dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "No Database Object!"}});

        return ()=>{
            if (database && databaseRef != null) off(databaseRef, 'value');
        };
    }, [refPath, auth.currentUser]);

    return [databaseRef, state.loading, state.error, state.values]
};

/**
 * Firebase Realtime Database Custom Hook for list of data. This hook allows for sorting by child in records or key of each record.
 * Noted that if both sortByChild and sortByKey are set, data will only be sorted by key. 
 * @param {string} refPath - Database Reference Path.
 * @param {(string|null)} sortByChild - Child attribute to be used in sorting data.
 * @param {boolean} sortByKey - Flag indicating if key should be used to sort data.
 * @param {string} sortOrder - Sorting order
 * @returns {DatabaseReference} databaseRef - Database Reference of the given path.
 * @returns {boolean} loading - Flag indicating if the hook is loading.
 * @returns {(string | null)} error - Error message.
 * @returns {Array<any>} sortedValues - List of potentially sorted values from the given path.
 */
export function useDatabaseList(refPath, sortByChild=null, sortByKey=false, sortOrder=SORT_ORDERS.NO_SORTING){
    
    const [databaseRef, loading, error, unsortedValues] = useDatabase(refPath);
    const [sortedValues, setSortedValues] = useState([]);

    const sortListByKey = (keys, values, order)=>{
        if (!Object.values(SORT_ORDERS).includes(order)) throw new Error("Invalid sort order!");
        else if (keys.length != values.length) throw new Error("Unequal keys and values length!");

        let mappedList = keys.map((key, idx)=>{
            if (typeof key == 'object'){
                return {
                    __key__: JSON.stringify(key).toLowerCase(),
                    __idx__: idx
                };
            }else{
                return {
                    __key__: String(key).toLowerCase(),
                    __idx__: idx
                };
            };
        });

        mappedList.sort((a,b)=>{
            switch(order){
                case SORT_ORDERS.ASCENDING:
                    if (a.__key__ < b.__key__) return -1;
                    else if (a.__key__ > b.__key__) return 1;
                    else return 0;
                case SORT_ORDERS.DESCENDING:
                    if (a.__key__ < b.__key__) return 1;
                    else if (a.__key__ > b.__key__) return -1;
                    else return 0;
            }
        });

        let resultList = mappedList.map((skey, idx)=>{
            return {
                key: keys[skey.__idx__],
                value: values[skey.__idx__]
            };
        });
        return resultList;

    };

    const sortListByChild = (keys, values, child, order)=>{
        if (!Object.values(SORT_ORDERS).includes(order)) throw new Error("Invalid sort order!");
        else if (keys.length != values.length) throw new Error("Unequal keys and values length!");
        else if (typeof child != 'string') throw new Error("Invalid child key!");
        for (let i=0; i<values.length; i++) 
            if (values[i] == null || typeof values[i] != 'object' || !Object.keys(values[i]).includes(child)) throw new Error("Cannot sort by child!");
        
        let mappedList = values.map((value, idx)=>{
            if (typeof value[child] == 'object'){
                return {
                    __child__: JSON.stringify(value[child]).toLowerCase(),
                    __idx__: idx
                };
            }else{
                return {
                    __child__: String(value[child]).toLowerCase(),
                    __idx__: idx
                };
            };
        });

        mappedList.sort((a,b)=>{
            switch(order){
                case SORT_ORDERS.ASCENDING:
                    if (a.__child__ < b.__child__) return -1;
                    else if (a.__child__ > b.__child__) return 1;
                    else return 0;
                case SORT_ORDERS.DESCENDING:
                    if (a.__child__ < b.__child__) return 1;
                    else if (a.__child__ > b.__child__) return -1;
                    else return 0;
            }
        });

        let resultList = mappedList.map((schild, idx)=>{
            return {
                key: keys[schild.__idx__],
                value: values[schild.__idx__]
            }
        });
        return resultList;
    };

    useEffect(()=>{
        if (unsortedValues != null){
            if (typeof unsortedValues !== 'object') setSortedValues([unsortedValues]);
            else{
                const byKey = (sortByKey == null?false:sortByKey);
                const byChild = (typeof sortByChild != "string"?null:sortByChild);
                const order = (!Object.values(SORT_ORDERS).includes(sortOrder)?SORT_ORDERS.NO_SORTING:sortOrder);
    
                const keys = Object.keys(unsortedValues);
                const values = Object.values(unsortedValues);
                    
                try{
                    if (order != SORT_ORDERS.NO_SORTING && (byKey || byChild != null)){        
                        if (byKey) setSortedValues(sortListByKey(keys, values, order));
                        else setSortedValues(sortListByChild(keys, values, byChild, order));
                    }else{
                        const mappedList = keys.map((key, idx)=>{
                            return {
                                key: key,
                                value: values[idx]
                            };
                        });
                        setSortedValues(mappedList);
                    }
                }catch(error){
                    
                    const mappedList = keys.map((key, idx)=>{
                        return {
                            key: key,
                            value: values[idx]
                        };
                    });
                    setSortedValues(mappedList);
                }
    
            }
        }else setSortedValues([]);
        
    }, [unsortedValues, sortByKey, sortByChild, sortOrder]);

    return [databaseRef, loading, error, sortedValues];
}
