'use client';

import { createContext, useContext, type ReactNode, useReducer } from "react";
export type User = {
  email: string;
  familyName: string;
  familyId?: number;
  memberId?: number;
  userId?: number;
};
type UserState = {
  isActive: boolean;
  user: User;
};

type UserContextValue = UserState & {
  addUser: (userData: User) => void;
  updateUser: (userData: User) => void;
  removeUser: () => void;
};

export const UserContext = createContext<UserContextValue | null>(null);

// Custom hook below is referenced in components that need access to state and actions
export function useUserContext() {
  const userCtx = useContext(UserContext);
  if (userCtx === null) {
    throw new Error("UserContext is null, which should never be the case.");
  }
  return userCtx;
}

//Discriminated union will allow actions to be of different types
type AddUserAction = {
  type: "ADD_USER";
  payload: User;
};
type UpdateUserAction = {
  type: "UPDATE_USER";
  payload: User;
};
type RemoveUserAction = {
  type: "REMOVE_USER";
};
type Action = AddUserAction | UpdateUserAction | RemoveUserAction;

export function userReducer(
  previousState: UserState,
  action: Action
): UserState {
  switch (action.type) {
    case "UPDATE_USER":
      console.log("UPDATE_USER->action.payload: ", action.payload)
      return {
        ...previousState,
        isActive: true,
        user: {
          ...previousState.user,
          email: action.payload.email,
          familyName: action.payload.familyName,
          familyId: action.payload.familyId,
          memberId: action.payload.memberId,
          userId: action.payload.userId,
        },
      };
    case "REMOVE_USER":
      console.log("REMOVE_USER")
      return {
        ...previousState,
        isActive: false,
      };
    case "ADD_USER":
      console.log("ADD_USER->action.payload: ", action.payload)
      return {
        ...previousState,
        isActive: true,
        user: {
          ...previousState.user,
          email: action.payload.email,
          familyName: action.payload.familyName,
          familyId: action.payload.familyId,
          memberId: action.payload.memberId,
          userId: action.payload.userId,
        },
      };
    default:
      return previousState;
  }
}

type UserContextProviderProps = {
  children: ReactNode;
};

const initialState = {
  isActive: false,
  user: {
    email: "",
    familyName: "",
    familyId: 0,
    memberId: 0,
    userId: 0,
  },
};

export default function UsersContextProvider({
  children,
}: UserContextProviderProps) {
  const [userState, dispatch] = useReducer(userReducer, initialState);
  const ctx: UserContextValue = {
    user: userState.user,
    isActive: userState.isActive,
    addUser(userData) {
      dispatch({ type: "ADD_USER", payload: userData });
    },
    updateUser(userData) {
      dispatch({ type: "UPDATE_USER", payload: userData });
    },
    removeUser() {
      dispatch({ type: "REMOVE_USER" });
    },
  };
  return (
    <UserContext.Provider value={ ctx }>{ children }</UserContext.Provider>
  );
}
