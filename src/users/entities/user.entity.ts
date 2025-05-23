import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn , Timestamp, OneToMany } from 'typeorm';
import { Product } from 'src/product/entities/product.entity';
import {Commande} from 'src/commandes/entities/commande.entity';
export enum UserRole {
    Vendeur = 'Vendeur',
    Client = 'Client',
}

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique:true})
    username: string;

    @Column({unique:true})
    email: string;

    @Column({select:false})
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    numtel: string;

    @Column({ nullable: true })
    companyname: string;

    @Column({ nullable: true })
    adresse: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        nullable: false,
    })
    role: UserRole;

    determineUserRole(): UserRole {
        if ((!this.name || !this.numtel)) {
            return UserRole.Vendeur;
        } else {
            return UserRole.Client;
        }
    }
    @CreateDateColumn()
    createdAt:Timestamp;
    @UpdateDateColumn()
    updateAt:Timestamp;


    @OneToMany(() => Product, product => product.user)
    product: Product[];
    @OneToMany(() => Commande, (commande) => commande.user)
    commandes: Commande[];
}




