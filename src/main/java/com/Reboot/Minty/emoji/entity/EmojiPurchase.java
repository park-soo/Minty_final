package com.Reboot.Minty.emoji.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class EmojiPurchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "emoji_id")
    private EmojiShop emojiId;

    @Column(name = "buyer_id")
    private Long buyerId;

    @Column(name = "price")
    private int price;
}
