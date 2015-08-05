declare module 'tactical' {
	
	export type FailureHandler = (err: any, result: Failure) => void;
	
	/** A callback to handle resolving a mutation. */
	export type ResolutionHandler = (err: any, result: BaseData) => void;
	
	/** A callback to handle satisfying a request. */
	export type ResponseHandler = (err: any, result: BaseData) => void;
	/**
	 * An interface that a backend must implement and provide to Tactical's implementation of
	 * SocketServer.
	 */
	export interface BackendService {
	  /**
	   * Called by SocketServer when a mutation is received from the client. The 'key' was provided by
	   * the application to identify the 'mutation', the 'base' was provided by the backend services
	   * to identify the data associated with the 'key', the 'id' was provided by Tactical to identify
	   * the 'mutation', and the 'mutation' was provided by the application to be applied to the backend
	   * data model.
	   *
	   * 'resolve' should be called if the 'mutation' can be successfully applied to the data model. A
	   * mutation can only be considered successful if the resulting change to the data model is deeply
	   * equal to the provided 'mutation'. This will notify all connected clients that a new mutation
	   * has been resolved by the backend services.
	   *
	   * 'fail' should be called if the 'mutation' cannot be applied or if the resulting change of
	   * applying the 'mutation' does not deeply equal the 'mutation' provided. This will notify
	   * the calling client that their mutation could not be applied.
	   */
	  onMutation(key: Object, base: string, id: number, mutation: Object, resolve: ResolutionHandler,
	             fail: FailureHandler): void;
	
	  /**
	   * Called by SocketServer when a request is received from the client. The 'key' was provided
	   * by the application to identify the request.
	   *
	   * 'respond' should be called once the request has been satisfied by the backend services.
	   * This will notify the calling client that their request has been satisfied.
	   */
	  onRequest(key: Object, respond: ResponseHandler): void;
	}
	
	/**
	 * A callback result type for ResolutionHandler and ResponseHandler.
	 */
	export interface BaseData {
	  base: string;  // a unique 'base' version provided by the backend service to identify the 'data'
	  data: Object;  // the 'data' to send upstream to the client
	}
	
	/**
	 * A callback result type for FailureHandler.
	 */
	export interface Failure {
	  reason: string;    // a short description of why the mutation was failed
	  context?: Object;  // any 'contextual' data surrounding the 'reason' why the mutation was failed
	}	
}
