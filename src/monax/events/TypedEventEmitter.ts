
export class TypedEventEmitter<T> {
    
    private _listeners: Array<{
        callback: (eventData: T) => void,
        context?: any
    }> = [];

    on(aListener: (eventData: T) => void, aCtx?: any) {
        this._listeners.push({ callback: aListener, context: aCtx } );
    }

    off(aListener: (eventData: T) => void, aCtx?: any) {
        let id = this._listeners.findIndex(item => item.callback === aListener && (aCtx && item.context === aCtx));
        while (id >= 0) {
            this._listeners.splice(id, 1);
            id = this._listeners.findIndex(item => item.callback === aListener);
        }
    }

    emit(aEventData: T) {
        this._listeners.forEach(aListener => {
            if (aListener.context) {
                aListener.callback.call(aListener.context, aEventData);
            }
            else {
                aListener.callback(aEventData);
            }
        });
    }

}