import { User } from "../models/user";
import { Repository } from "./repository";

export class UserRepository extends Repository<User> {
  constructor() {
    super('Users')
  }

  findUserByEmail(email: string, callback: (model: User | undefined) => void) {
    this.getAll((users) => {
      if (users) {
        callback(users.find((u) => u.email === email));
      } else {
        callback(undefined);
      }
    });
  }

  protected serialize(model: User): any {
    return {
      id: model?.id,
      name: model?.name,
      email: model?.email,
      createdAt: model?.createdAt?.getTime(),
    };
  }

  protected deserialize(json: any): User {
    const user = new User();    
    user.id = json.id;
    user.name = json.name;
    user.email = json.email;
    user.createdAt = new Date(json.createdAt);
    return user;
  }
}